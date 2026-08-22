from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .views import REFRESH_COOKIE


class AuthCookieTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        get_user_model().objects.create_user(username="tester", password="pass12345")

    def login(self):
        return self.client.post(
            reverse("login"), {"username": "tester", "password": "pass12345"}, format="json"
        )

    def test_login_sets_httponly_refresh_cookie(self):
        response = self.login()
        cookie = response.cookies.get(REFRESH_COOKIE)

        self.assertIsNotNone(cookie)
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Lax")
        self.assertEqual(cookie["path"], "/api/auth/")

    def test_failed_login_sets_no_cookie(self):
        response = self.client.post(
            reverse("login"), {"username": "tester", "password": "wrong"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIsNone(response.cookies.get(REFRESH_COOKIE))

    def test_login_returns_the_current_user(self):
        response = self.login()
        self.assertEqual(response.data["username"], "tester")

    def test_refresh_uses_the_cookie(self):
        self.login()
        response = self.client.post(reverse("token-refresh"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        # Sent back so the client does not have to remember who is signed in.
        self.assertEqual(response.data["username"], "tester")

    def test_refresh_without_a_cookie_is_rejected(self):
        response = self.client.post(reverse("token-refresh"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rejects_a_tampered_cookie(self):
        self.login()
        self.client.cookies[REFRESH_COOKIE] = "not-a-real-token"
        response = self.client.post(reverse("token-refresh"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refreshed_token_works_against_a_protected_endpoint(self):
        self.login()
        access = self.client.post(reverse("token-refresh")).data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(reverse("product-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_clears_the_cookie(self):
        self.login()
        response = self.client.post(reverse("logout"))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.cookies[REFRESH_COOKIE].value, "")
