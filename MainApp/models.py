import uuid
import os
from django.db import models
from sorl.thumbnail import ImageField
from django_countries.fields import CountryField

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=100, primary_key=True)

    def __str__(self):
        return self.name

class FearItem(models.Model):
    def text_wrapper(instance, filename):
        ext = filename.split('.')[-1]
        # get filename
        if instance.pk:
            filename = '{}_txt.jpg'.format(instance.pk, ext)
        # return the whole path to the file
        return os.path.join('text_files/', filename)

    item_id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    send_email = models.BooleanField(default=False)
    email = models.EmailField(max_length = 256, null=True, blank=True)
    gender = models.CharField(max_length = 256, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    tags = models.ManyToManyField(Tag)
    country = CountryField()
    text_file = models.ImageField(upload_to=text_wrapper)
    valid = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)

class FearImage(models.Model):
    def image_wrapper(instance, filename):
        ext = filename.split('.')[-1]
        # get filename
        img_idx = instance.fear_item.fearimage_set.count()
        filename = '{}_{}_img.jpg'.format(instance.fear_item.item_id, img_idx, ext)
        # return the whole path to the file
        return os.path.join('image_files/', filename)

    def __str__(self):
        return self.image_file.url

    fear_item = models.ForeignKey(FearItem, on_delete=models.CASCADE)
    image_file = models.ImageField(upload_to=image_wrapper)


# from MainApp.models import FearItem
# items = FearItem.objects.all()
