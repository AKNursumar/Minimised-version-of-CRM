from rest_framework import viewsets

from .models import Opportunity
from .serializers import OpportunitySerializer


class OpportunityViewSet(viewsets.ModelViewSet):

    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer