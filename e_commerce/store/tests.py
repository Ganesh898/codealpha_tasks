import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User


class EcommerceFlowTests(TestCase):
    def test_register_and_cart_flow(self):
        register_response = self.client.post(
            reverse("register_user"),
            data=json.dumps({"username": "tester", "email": "tester@example.com", "password": "secret123"}),
            content_type="application/json",
        )
        self.assertEqual(register_response.status_code, 200)

        cart_response = self.client.post(
            reverse("cart_api"),
            data=json.dumps({"item": {"name": "Laptop", "price": 49999, "quantity": 1}}),
            content_type="application/json",
        )
        self.assertEqual(cart_response.status_code, 200)

        remove_response = self.client.post(
            reverse("cart_api"),
            data=json.dumps({"action": "remove", "name": "Laptop"}),
            content_type="application/json",
        )
        self.assertEqual(remove_response.status_code, 200)
        self.assertEqual(json.loads(remove_response.content)["cart"], [])

        checkout_response = self.client.post(reverse("checkout_api"), content_type="application/json")
        self.assertEqual(checkout_response.status_code, 400)

        self.client.post(
            reverse("cart_api"),
            data=json.dumps({"item": {"name": "Laptop", "price": 49999, "quantity": 1}}),
            content_type="application/json",
        )
        checkout_response = self.client.post(
            reverse("checkout_api"),
            data=json.dumps({"address": "Main Street", "customer": "Tester"}),
            content_type="application/json",
        )
        self.assertEqual(checkout_response.status_code, 200)
        self.assertTrue(json.loads(checkout_response.content)["success"])

        admin_response = self.client.get(reverse("admin_orders"))
        self.assertEqual(admin_response.status_code, 200)
        self.assertGreaterEqual(len(json.loads(admin_response.content)["orders"]), 1)

    def test_login_with_existing_user(self):
        User.objects.create_user(username="demo", email="demo@example.com", password="demo123")
        response = self.client.post(
            reverse("login_user"),
            data=json.dumps({"username": "demo", "password": "demo123"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(json.loads(response.content)["success"])

        logout_response = self.client.post(reverse("logout_user"))
        self.assertEqual(logout_response.status_code, 200)
        self.assertTrue(json.loads(logout_response.content)["success"])

        auth_response = self.client.get(reverse("auth_status"))
        self.assertFalse(json.loads(auth_response.content)["authenticated"])

    def test_auth_status_and_user_orders(self):
        User.objects.create_user(username="buyer", email="buyer@example.com", password="buyer123")
        self.client.post(
            reverse("login_user"),
            data=json.dumps({"username": "buyer", "password": "buyer123"}),
            content_type="application/json",
        )

        auth_response = self.client.get(reverse("auth_status"))
        auth_data = json.loads(auth_response.content)
        self.assertTrue(auth_data["authenticated"])
        self.assertEqual(auth_data["user"]["username"], "buyer")

        self.client.post(
            reverse("cart_api"),
            data=json.dumps({"item": {"name": "Shoes", "price": 999, "quantity": 1}}),
            content_type="application/json",
        )
        checkout_response = self.client.post(
            reverse("checkout_api"),
            data=json.dumps({"address": "Buyer Street", "customer": "Buyer", "payment_method": "COD"}),
            content_type="application/json",
        )
        order_id = json.loads(checkout_response.content)["order"]["id"]

        orders_response = self.client.get(reverse("user_orders"))
        orders_data = json.loads(orders_response.content)
        self.assertTrue(orders_data["authenticated"])
        self.assertEqual(orders_data["orders"][0]["id"], order_id)

        track_response = self.client.get(reverse("track_order", args=[order_id]))
        self.assertEqual(track_response.status_code, 200)
        self.assertEqual(json.loads(track_response.content)["order"]["display_id"], f"AP-{order_id:05d}")

    def test_password_reset_flow(self):
        user = User.objects.create_user(username="recover", email="recover@example.com", password="oldpass")

        forgot_response = self.client.post(
            reverse("forgot_password"),
            data=json.dumps({"username": "recover"}),
            content_type="application/json",
        )
        self.assertEqual(forgot_response.status_code, 200)
        forgot_data = json.loads(forgot_response.content)
        self.assertTrue(forgot_data["success"])

        reset_response = self.client.post(
            reverse("reset_password"),
            data=json.dumps({
                "user_id": forgot_data["user_id"],
                "reset_code": forgot_data["reset_code"],
                "new_password": "newpass123",
            }),
            content_type="application/json",
        )
        self.assertEqual(reset_response.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("newpass123"))
