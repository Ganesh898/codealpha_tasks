import json
import secrets
from datetime import timedelta
from pathlib import Path

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf import settings
from django.core.mail import send_mail
from django.http import FileResponse, Http404, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Order, PasswordResetRequest

BASE_DIR = Path(__file__).resolve().parent.parent


def api_root(request):
    return JsonResponse({
        "service": "e-commerce API",
        "status": "ok",
        "endpoints": [
            "/api/auth/me/",
            "/api/cart/",
            "/api/checkout/",
            "/api/orders/",
        ],
    })


@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    payload = json.loads(request.body or b"{}")
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""

    if not username or not email or not password:
        return JsonResponse({"success": False, "message": "Please fill all fields"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"success": False, "message": "Username already exists"}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    login(request, user)
    return JsonResponse({"success": True, "message": "Account created", "user": {"username": user.username, "email": user.email}})


@csrf_exempt
@require_http_methods(["POST"])
def login_user(request):
    payload = json.loads(request.body or b"{}")
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return JsonResponse({"success": False, "message": "Please enter username and password"}, status=400)

    user = None
    if "@" in username:
        user = User.objects.filter(email=username).first()
    else:
        user = User.objects.filter(username=username).first()

    if user is None:
        user = authenticate(request, username=username, password=password)
    elif not user.check_password(password):
        user = None

    if user is None:
        return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)

    login(request, user)
    return JsonResponse({"success": True, "message": "Logged in", "user": {"username": user.username, "email": user.email}})


@require_http_methods(["GET"])
def auth_status(request):
    if request.user.is_authenticated:
        return JsonResponse({"authenticated": True, "user": {"username": request.user.username, "email": request.user.email}})
    return JsonResponse({"authenticated": False})


@csrf_exempt
@require_http_methods(["POST"])
def logout_user(request):
    logout(request)
    return JsonResponse({"success": True, "message": "Logged out"})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def cart_api(request):
    if request.method == "GET":
        cart = request.session.get("cart", [])
        return JsonResponse({"cart": cart})

    payload = json.loads(request.body or b"{}")
    cart = request.session.get("cart", [])
    action = payload.get("action")
    if action == "remove":
        name = (payload.get("name") or "").strip()
        cart = [item for item in cart if item.get("name") != name]
        request.session["cart"] = cart
        return JsonResponse({"success": True, "cart": cart})

    item = payload.get("item")
    if not item:
        return JsonResponse({"success": False, "message": "No item supplied"}, status=400)

    existing = next((entry for entry in cart if entry["name"] == item["name"]), None)
    if existing:
        existing["quantity"] += item.get("quantity", 1)
    else:
        cart.append({"name": item["name"], "price": item.get("price", 0), "quantity": item.get("quantity", 1)})

    request.session["cart"] = cart
    return JsonResponse({"success": True, "cart": cart})


@csrf_exempt
@require_http_methods(["POST"])
def checkout_api(request):
    payload = json.loads(request.body or b"{}")
    cart = request.session.get("cart", [])
    if not cart:
        return JsonResponse({"success": False, "message": "Cart is empty"}, status=400)

    amount = sum(float(item.get("price", 0)) * int(item.get("quantity", 0)) for item in cart)
    order = Order.objects.create(
        user=request.user if request.user.is_authenticated else None,
        customer_name=payload.get("customer") or (request.user.username if request.user.is_authenticated else "Guest"),
        address=payload.get("address") or "Not provided",
        items=cart,
        amount=round(amount, 2),
        payment_status="Card payment simulated successfully",
    )
    request.session["cart"] = []
    return JsonResponse({
        "success": True,
        "message": "Order placed successfully",
        "amount": round(amount, 2),
        "payment": "Card payment simulated successfully",
        "order": {
            "id": order.id,
            "customer": order.customer_name,
            "address": order.address,
            "items": order.items,
            "amount": float(order.amount),
            "payment": order.payment_status,
        },
    })


@csrf_exempt
@require_http_methods(["POST"])
def forgot_password(request):
    payload = json.loads(request.body or b"{}")
    identifier = (payload.get("username") or payload.get("email") or "").strip()
    if not identifier:
        return JsonResponse({"success": False, "message": "Please enter username or email"}, status=400)

    user = User.objects.filter(username=identifier).first() or User.objects.filter(email=identifier).first()
    if user is None:
        return JsonResponse({"success": False, "message": "User not found"}, status=404)

    reset_code = secrets.token_hex(3).upper()
    PasswordResetRequest.objects.filter(user=user).update(used=True)
    reset_request = PasswordResetRequest.objects.create(
        user=user,
        reset_code=reset_code,
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    if not user.email:
        reset_request.delete()
        return JsonResponse({"success": False, "message": "This account has no email address"}, status=400)
    if settings.EMAIL_BACKEND == "django.core.mail.backends.console.EmailBackend":
        reset_request.delete()
        return JsonResponse({
            "success": False,
            "message": "Email service is not configured. Add SMTP settings and restart the server.",
        }, status=503)

    try:
        send_mail(
            subject="Your Annapurna password reset code",
            message=(
                f"Hello {user.username},\n\n"
                f"Your password reset code is: {reset_request.reset_code}\n\n"
                "This code expires in 15 minutes. If you did not request this, you can ignore this email."
            ),
            from_email=None,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as error:
        reset_request.delete()
        return JsonResponse({
            "success": False,
            "message": f"Email delivery failed ({error.__class__.__name__}). Check your Gmail App Password and SMTP settings.",
        }, status=503)
    return JsonResponse({"success": True, "message": "Reset code sent to your email", "user_id": user.id})


@csrf_exempt
@require_http_methods(["POST"])
def reset_password(request):
    payload = json.loads(request.body or b"{}")
    user_id = payload.get("user_id")
    reset_code = (payload.get("reset_code") or "").strip().upper()
    new_password = payload.get("new_password") or ""

    if not user_id or not reset_code or not new_password:
        return JsonResponse({"success": False, "message": "Please provide all details"}, status=400)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({"success": False, "message": "User not found"}, status=404)

    reset_request = PasswordResetRequest.objects.filter(user=user, reset_code=reset_code, used=False).order_by("-created_at").first()
    if reset_request is None or reset_request.expires_at <= timezone.now():
        return JsonResponse({"success": False, "message": "Invalid or expired reset code"}, status=400)

    user.set_password(new_password)
    user.save()
    reset_request.used = True
    reset_request.save()
    return JsonResponse({"success": True, "message": "Password updated successfully"})


@require_http_methods(["GET"])
def admin_orders(request):
    orders = Order.objects.select_related("user").order_by("-created_at")
    payload = []
    for order in orders:
        payload.append({
            "id": order.id,
            "customer": order.customer_name,
            "address": order.address,
            "amount": float(order.amount),
            "payment": order.payment_status,
            "items": order.items,
            "username": order.user.username if order.user else None,
            "created_at": order.created_at.isoformat(),
        })
    return JsonResponse({"orders": payload})


@require_http_methods(["GET"])
def admin_users(request):
    users = User.objects.order_by("-date_joined")
    payload = []
    for user in users:
        payload.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "date_joined": user.date_joined.isoformat(),
            "order_count": user.orders.count(),
        })
    return JsonResponse({"users": payload})


def serialize_order(order):
    current_status = "Order Placed"
    if "Pending" in order.payment_status:
        current_status = "Order Confirmed"
    elif "Paid" in order.payment_status or "successfully" in order.payment_status:
        current_status = "Packed & Ready"

    estimated_delivery = (order.created_at + timedelta(days=5)).strftime("%B %d, %Y")
    return {
        "id": order.id,
        "display_id": f"AP-{order.id:05d}",
        "customer": order.customer_name,
        "address": order.address,
        "amount": float(order.amount),
        "payment": order.payment_status,
        "items": order.items,
        "username": order.user.username if order.user else None,
        "created_at": order.created_at.isoformat(),
        "estimated_delivery": estimated_delivery,
        "status": current_status,
    }


@require_http_methods(["GET"])
def user_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False, "orders": []})

    orders = Order.objects.filter(user=request.user).order_by("-created_at")
    return JsonResponse({
        "authenticated": True,
        "orders": [serialize_order(order) for order in orders],
    })


@require_http_methods(["GET"])
def track_order(request, order_id):
    order = Order.objects.filter(pk=order_id).select_related("user").first()
    if order is None:
        return JsonResponse({"success": False, "message": "Order not found"}, status=404)

    if request.user.is_authenticated and order.user_id and order.user_id != request.user.id:
        return JsonResponse({"success": False, "message": "This order belongs to another account"}, status=403)

    return JsonResponse({"success": True, "order": serialize_order(order)})


def serve_file(request, filename="index.html"):
    file_path = BASE_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise Http404

    content_type = "text/html" if file_path.suffix.lower() == ".html" else None
    return FileResponse(open(file_path, "rb"), content_type=content_type)
@csrf_exempt
@require_http_methods(["POST"])
def checkout_api(request):
    payload = json.loads(request.body or b"{}")
    cart = request.session.get("cart", [])
    if not cart:
        return JsonResponse({"success": False, "message": "Cart is empty"}, status=400)
    
    amount = sum(float(item.get("price", 0)) * int(item.get("quantity", 0)) for item in cart)
    
    # Frontend se payment method aur upi_id nikalna
    payment_method = payload.get("payment_method", "COD")
    upi_id = payload.get("upi_id", "")
    
    # Custom payment status string banana admin panel ke liye
    if payment_method == "COD":
        status_string = "Cash on Delivery (Pending)"
    elif payment_method == "UPI":
        status_string = f"Paid via UPI (ID: {upi_id})"
    else:
        status_string = "Paid via Card (Simulated)"

    order = Order.objects.create(
        user=request.user if request.user.is_authenticated else None,
        customer_name=payload.get("customer") or (request.user.username if request.user.is_authenticated else "Guest"),
        address=payload.get("address") or "Not provided",
        items=cart,
        amount=round(amount, 2),
        payment_status=status_string, # Yeh status seedhe database me save hoga aur admin panel me dikhega
    )
    request.session["cart"] = []
    return JsonResponse({
        "success": True,
        "message": "Order placed successfully",
        "amount": round(amount, 2),
        "payment": status_string,
        "order": {
            "id": order.id,
            "customer": order.customer_name,
            "address": order.address,
            "items": order.items,
            "amount": float(order.amount),
            "payment": order.payment_status,
        },
    })
