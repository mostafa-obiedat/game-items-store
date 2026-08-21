from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Product


class ProductApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="tester", password="pass12345")
        for i in range(1, 26):
            Product.objects.create(
                id=i,
                title=f"Item {i}",
                description="something",
                price=Decimal("10.50"),
                location="JO" if i % 2 else "SA",
            )

    def authenticate(self):
        response = self.client.post(
            reverse("login"), {"username": "tester", "password": "pass12345"}, format="json"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_list_requires_authentication(self):
        response = self.client.get(reverse("product-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_returns_tokens(self):
        response = self.client.post(
            reverse("login"), {"username": "tester", "password": "pass12345"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_rejects_bad_password(self):
        response = self.client.post(
            reverse("login"), {"username": "tester", "password": "nope"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_is_paginated(self):
        self.authenticate()
        response = self.client.get(reverse("product-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 12)
        self.assertIsNotNone(response.data["next"])

    def test_page_size_is_capped(self):
        self.authenticate()
        response = self.client.get(reverse("product-list"), {"page_size": 500})
        self.assertEqual(len(response.data["results"]), 25)

    def test_filter_by_location(self):
        self.authenticate()
        response = self.client.get(reverse("product-list"), {"location": "SA"})
        self.assertTrue(all(item["location"] == "SA" for item in response.data["results"]))
        self.assertEqual(response.data["count"], 12)

    def test_unknown_location_is_rejected(self):
        self.authenticate()
        response = self.client.get(reverse("product-list"), {"location": "XX"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_detail_returns_product(self):
        self.authenticate()
        response = self.client.get(reverse("product-detail", args=[3]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Item 3")

    def test_missing_product_returns_404(self):
        self.authenticate()
        response = self.client.get(reverse("product-detail", args=[9999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
