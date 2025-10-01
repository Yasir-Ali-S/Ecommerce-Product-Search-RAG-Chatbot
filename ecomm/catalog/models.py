from django.db import models

# Create your models here.

class Product(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=120)
    description = models.TextField()
    category = models.CharField(max_length=60)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True, null=True)
    brand = models.CharField(max_length=60, default='Generic')
    color = models.CharField(max_length=30, blank=True, null=True)
    material = models.CharField(max_length=40, blank=True, null=True)
    available_sizes = models.JSONField(default=list)
    in_stock = models.BooleanField(default=True)
    rating = models.FloatField(default=0.0)
    num_reviews = models.IntegerField(default=0)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['title']
