from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, OrderViewSet, QueueViewSet, CouponViewSet

router = DefaultRouter()
router.register("products", ProductViewSet)
router.register("orders", OrderViewSet, basename="order")
router.register("queue", QueueViewSet, basename="queue")
router.register("coupons", CouponViewSet, basename="coupon")

urlpatterns = router.urls
