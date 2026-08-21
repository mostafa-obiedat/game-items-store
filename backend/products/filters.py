from django_filters import rest_framework as filters

from .models import Location, Product


class ProductFilter(filters.FilterSet):
    location = filters.ChoiceFilter(choices=Location.choices)
    search = filters.CharFilter(field_name="title", lookup_expr="icontains")

    class Meta:
        model = Product
        fields = ("location", "search")
