from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ProductViewSet, OrderViewSet, QueueViewSet

router = DefaultRouter()
router.register("customers", CustomerViewSet)
router.register("products", ProductViewSet)
router.register("orders", OrderViewSet)
router.register("queue", QueueViewSet)

urlpatterns = router.urls