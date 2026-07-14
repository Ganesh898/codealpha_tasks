from django.contrib import admin
from django.urls import path

from store import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.serve_file, {"filename": "project1.html"}, name="home"),
    path("api/auth/register/", views.register_user, name="register_user"),
    path("api/auth/login/", views.login_user, name="login_user"),
    path("api/auth/logout/", views.logout_user, name="logout_user"),
    path("api/auth/me/", views.auth_status, name="auth_status"),
    path("api/auth/forgot-password/", views.forgot_password, name="forgot_password"),
    path("api/auth/reset-password/", views.reset_password, name="reset_password"),
    path("api/cart/", views.cart_api, name="cart_api"),
    path("api/checkout/", views.checkout_api, name="checkout_api"),
    path("api/orders/", views.user_orders, name="user_orders"),
    path("api/orders/<int:order_id>/", views.track_order, name="track_order"),
    path("api/admin/orders/", views.admin_orders, name="admin_orders"),
    path("api/admin/users/", views.admin_users, name="admin_users"),
    path("<path:filename>", views.serve_file, name="pages"),
]
