from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Product

from .models import Order


class OrderApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.user = User.objects.create_user(username="buyer", password="pass12345")
        cls.other_user = User.objects.create_user(username="someone", password="pass12345")
        cls.product = Product.objects.create(
            title="Mystic Wand",
            slug="mystic-wand",
            description="Casts powerful spells",
            price=Decimal("200.00"),
            location="SA",
        )

    def authenticate(self, username="buyer"):
        response = self.client.post(
            reverse("login"), {"username": username, "password": "pass12345"}, format="json"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_purchase_requires_authentication(self):
        response = self.client.post(
            reverse("order-create"), {"product_id": self.product.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_purchase_creates_order(self):
        self.authenticate()
        response = self.client.post(
            reverse("order-create"), {"product_id": self.product.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)

        order = Order.objects.get()
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.price, self.product.price)
        self.assertEqual(response.data["buyer"], "buyer")
        self.assertEqual(response.data["product"]["title"], "Mystic Wand")

    def test_price_is_frozen_at_purchase_time(self):
        self.authenticate()
        self.client.post(reverse("order-create"), {"product_id": self.product.id}, format="json")

        self.product.price = Decimal("999.00")
        self.product.save()

        order = Order.objects.get()
        self.assertEqual(order.price, Decimal("200.00"))

    def test_buying_unknown_product_fails(self):
        self.authenticate()
        response = self.client.post(reverse("order-create"), {"product_id": 9999}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_product_id_is_required(self):
        self.authenticate()
        response = self.client.post(reverse("order-create"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_receipt_can_be_fetched_by_reference(self):
        order = Order.objects.create(user=self.user, product=self.product, price=Decimal("200.00"))
        self.authenticate()
        response = self.client.get(reverse("order-detail", args=[order.reference]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reference"], str(order.reference))

    def test_receipt_of_another_user_is_hidden(self):
        order = Order.objects.create(user=self.user, product=self.product, price=Decimal("200.00"))
        self.authenticate("someone")
        response = self.client.get(reverse("order-detail", args=[order.reference]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
