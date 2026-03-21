from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ProductViewSet, OrderViewSet

router = DefaultRouter()
router.register("customers", CustomerViewSet)
router.register("products", ProductViewSet)
router.register("orders", OrderViewSet)

urlpatterns = router.urls