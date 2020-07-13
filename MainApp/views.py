from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse, JsonResponse
from .forms import SubmissionForm, UploadFileForm
from .models import FearItem, FearComposite

from django.contrib.auth.decorators import user_passes_test

import json
from django.core import serializers

from django.views.decorators.http import require_http_methods

from sorl.thumbnail import get_thumbnail

import numpy as np
from nltk.tokenize import TweetTokenizer
from sklearn.feature_extraction.text import CountVectorizer
import string
import random

# NOT REALLY WORKING, NEEDS FIXING
@require_http_methods(["GET"])
def get_fear_items(request):
    # pks = request.GET.getlist('pks')
    # print(pks)

    # fearItems = FearItem.objects.filter(pk__in=pks)
    # fearItemsJson = json.loads(serializers.serialize('json', fearItems,
    #     fields=('gender','age','country','fear_text','fear_colors_text','image_1','image_2','image_1_tb','image_2_tb','valid','date_created')))
    # return JsonResponse(fearItemsJson, safe=False)
    return JsonResponse({}, safe=False)

@require_http_methods(["GET"])
def get_fear_item(request):
    pk = request.GET.get('pk')

    fearItem = FearItem.objects.filter(pk=pk)
    fearItemJson = json.loads(serializers.serialize('json', fearItem,
        fields=('gender','age','country','fear_text','fear_colors_text','image_1','image_2','image_1_tb','image_2_tb','valid','date_created')))
    return JsonResponse(fearItemJson, safe=False)

@require_http_methods(["GET"])
def get_word_cloud(request):

    DEFAULT_MIN_LINKS = 2 # minimum number of links a word must have to be included
    DEFAULT_MAX_WORDS = 50 # maximum number of words we want in our cloud

    try:
        min_links = int(request.GET.get("min_links", DEFAULT_MIN_LINKS))
        max_words = int(request.GET.get("max_words", DEFAULT_MAX_WORDS))
    except:
        min_links = DEFAULT_MIN_LINKS
        max_words = DEFAULT_MAX_WORDS

    print(max_words, min_links)

    fearItems = FearItem.objects.exclude(valid=False)

    # for fearItem in fearItems:
    #     print("***********************************************")
    #     print("people" in fearItem.fear_text.lower())
    #     print(fearItem.fear_text)
# replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    word_array = np.array([fearItem.fear_text.translate(str.maketrans('', '', string.punctuation)) for fearItem in fearItems])

    vectorizer = CountVectorizer(stop_words='english')
    cv_fit = vectorizer.fit_transform(word_array)

    vocabulary = vectorizer.get_feature_names()
    counts = np.asarray(cv_fit.sum(axis=0))[0]
    sorted_ind = np.argsort(-counts) # we negate it to sort in reverse order

    # n = 20
    # top_n_words = [(vocabulary[ind], counts[ind]) for ind in sorted_ind[:n]]
    top_n_words = [(vocabulary[ind], counts[ind]) for ind in sorted_ind if counts[ind] >= min_links]

    allTexts = []
    index = 0
    remaining_queryset = FearItem.objects.exclude(valid=False)

    # OPTIMIZE THIS FURTHER??
    num_words = 0
    while (remaining_queryset.count() >= 0) and (index < len(top_n_words)) and (num_words < max_words):
        word = top_n_words[index][0]
        count = top_n_words[index][1]

        if (count <= 1):
            break

        queryset = fearItems.filter(fear_text__icontains=word)
        remaining_queryset = remaining_queryset.exclude(fear_text__icontains=word)
        # allTexts.append([queryset.count(),[fearItem.fear_text for fearItem in queryset]])
        if (queryset.count() > 0):
            allTexts.append({"word":word,"fear_items":json.loads(serializers.serialize('json', queryset, fields=('pk','gender','age','country','fear_text','fear_colors_text','image_1','image_2','image_1_tb','image_2_tb','valid','date_created')))})
            num_words += 1
        index += 1

    # allTexts.append({"word":"_NONE_","fear_items":json.loads(serializers.serialize('json', remaining_queryset))})

    return JsonResponse(allTexts, safe=False)

def word_cloud(request):
    return render(request, 'MainApp/word_cloud.html')

@require_http_methods(["POST"])
def add_composite(request):
    # data = request.POST.get('data')
    # image0 = request.POST.get('0')
    # image1 = request.POST.get('1')
    # image2 = request.POST.get('2')

    MAX_COMPOSITES = 100

    # Limit the max number of entries to 100
    numToDelete = FearComposite.objects.all().count() - MAX_COMPOSITES + 1
    if (numToDelete > 0):
        for i in range(numToDelete):
            print(FearComposite.objects.all().count())
            FearComposite.objects.first().delete()

    try:
        pk0 = request.POST.get('pk-0')
        opacity0 = request.POST.get('opacity-0')
        thumb0 = request.POST.get('imageIndex-0')
        fear_item0 = FearItem.objects.get(pk=pk0)

        pk1 = request.POST.get('pk-1')
        opacity1 = request.POST.get('opacity-1')
        thumb1 = request.POST.get('imageIndex-1')
        fear_item1 = FearItem.objects.get(pk=pk1)

        pk2 = request.POST.get('pk-2')
        opacity2 = request.POST.get('opacity-2')
        thumb2 = request.POST.get('imageIndex-2')
        fear_item2 = FearItem.objects.get(pk=pk2)

        FearComposite.objects.update_or_create(fear_item_0=fear_item0, opacity_0=opacity0,fear_item_1=fear_item1, opacity_1=opacity1,fear_item_2=fear_item2, opacity_2=opacity2, image_idx_0 = thumb0, image_idx_1 = thumb1, image_idx_2 = thumb2)

        # print(json.loads(request.POST[0]))
        # defaults = {
        #     "send_email": send_email,
        #     "email": email,
        #     "gender": gender,
        #     "age": age,
        #     "country": country,
        #     "fear_text": fear_text,
        #     "fear_colors_text": fear_colors_text,
        # }
        # fearItem = FearItem.objects.update_or_create(item_id = uuid, defaults=defaults)
        return JsonResponse({"success": True, "count": FearComposite.objects.all().count()})
    except Exception as e:
        return JsonResponse({"success": False, "error":str(e)})

@require_http_methods(["GET"])
def fear_items(request):
    fearItems = FearItem.objects.exclude(valid=False).order_by("-date_created")
    for fearItem in fearItems:
        fearItem.tb1 = fearItem.image_1_thumb
        # print(fearItem.image_2_tb)
        # if (fearItem.image_1):
        if (not fearItem.image_1_tb):
            fearItem.image_1_tb = get_thumbnail(fearItem.image_1, '600x600', crop='center').name
            fearItem.save()

        # if (fearItem.image_2):
        if (fearItem.image_2 and (not fearItem.image_2_tb)):
            fearItem.image_2_tb = get_thumbnail(fearItem.image_2, '600x600', crop='center').name
            fearItem.save()

    data = serializers.serialize('json', fearItems)
    return JsonResponse(json.loads(data), safe=False)

def project_intro(request):
    context = {}
    return render(request, 'MainApp/project_intro.html', context)

def about(request):
    context = {}
    return render(request, 'MainApp/about.html', context)

def about_workshop(request):
    context = {}
    return render(request, 'MainApp/about_workshop.html', context)

def viz1(request):
    context = {}
    return render(request, 'MainApp/viz1.html', context)

def viz1_gallery(request):
    context = {"fear_composites": FearComposite.objects.all()}
    return render(request, 'MainApp/viz1_gallery.html', context)

def viz2(request):
    pk = request.GET.get('pk', '')

    valid_fear_items = FearItem.objects.exclude(valid=False).order_by("-date_created")

    filtered_fear_items = list(valid_fear_items)
    random.shuffle(filtered_fear_items)

    # filtered_fear_items_double = list(valid_fear_items.exclude(image_2=""))
    # filtered_fear_items_single = list(valid_fear_items.filter(image_2=""))
    # num_single = len(filtered_fear_items_single)
    # filtered_fear_items = filtered_fear_items_double
    # for i in range(num_single):
    #     filtered_fear_items.insert(random.randint(0, len(filtered_fear_items)), filtered_fear_items_single[i])

    # filtered_fear_items = list(filtered_fear_items_double) + list(filtered_fear_items_single)
    # filtered_fear_items_single = FearItem.objects.exclude(valid=False).order_by("-date_created")

    context = {"fear_items": filtered_fear_items}
    return render(request, 'MainApp/viz2.html', context)

def index(request):
    # return HttpResponse("Hello, the visualization for this artwork is still under development. Go to <a href='/submit'>this page</a> to submit an entry!")
    # filtered_fear_items = FearItem.objects.exclude(valid=False).order_by("-date_created")
    # context = {"fear_items": filtered_fear_items}
    # return render(request, 'MainApp/index.html', context)

    filtered_fear_items = FearItem.objects.exclude(valid=False).order_by("-date_created")
    context = {"fear_items": filtered_fear_items}
    return render(request, 'MainApp/index.html', context)

@user_passes_test(lambda u: u.is_superuser, login_url='/admin')
def viz(request):
    filtered_fear_items = FearItem.objects.exclude(valid=False)
    context = {"fear_items": filtered_fear_items}
    return render(request, 'MainApp/viz.html', context)

@user_passes_test(lambda u: u.is_superuser, login_url='/admin')
def delete_entry(request):
    if request.method == 'POST': # If the form has been submitted...
        uuid = request.POST['uuid']
        try:
            FearItem.objects.get(item_id=uuid).delete()
            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error":str(e)})

        # form = LinkBggForm(request.POST) # A form bound to the POST data
        # if form.is_valid(): # All validation rules pass
    else:
        return HttpResponse("Invalid non POST call to link_bgg!")

def submit(request):
    context = {'form':SubmissionForm()}
    return render(request, 'MainApp/submit.html', context)

def submit_one(request):
    context = {'form':SubmissionForm()}
    return render(request, 'MainApp/submit_one.html', context)

def submit_workshop(request):
    context = {'form':SubmissionForm()}
    return render(request, 'MainApp/submit_short.html', context)

def complete_submission(request):
    if request.method == 'POST': # If the form has been submitted...
        print(request.POST)
        uuid = request.POST['uuid']
        try:
            fearItem = FearItem.objects.get(item_id=uuid)
            fearItem.valid=True
            fearItem.save()
            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error":str(e)})


        # form = LinkBggForm(request.POST) # A form bound to the POST data
        # if form.is_valid(): # All validation rules pass
    else:
        return HttpResponse("Invalid non POST call to link_bgg!")

def submit_consent(request):
    if request.method == 'POST': # If the form has been submitted...

        form = SubmissionForm(request.POST)
        if form.is_valid():
            send_email = form.cleaned_data["email_checkbox"]
            email = form.cleaned_data["email"]
            gender = form.cleaned_data["gender"]
            age = form.cleaned_data["age"]
            uuid = form.cleaned_data["uuid"]
            country = form.cleaned_data["country"]
            fear_text = form.cleaned_data["fear_text"]
            fear_colors_text = form.cleaned_data["fear_colors_text"]

            try:
                defaults = {
                    "send_email": send_email,
                    "email": email,
                    "gender": gender,
                    "age": age,
                    "country": country,
                    "fear_text": fear_text,
                    "fear_colors_text": fear_colors_text,
                }
                fearItem = FearItem.objects.update_or_create(item_id = uuid, defaults=defaults)
                return JsonResponse({"success": True, "type":"consent"})
            except Exception as e:
                return JsonResponse({"success": False, "type":"consent", "error":str(e)})

        # form = LinkBggForm(request.POST) # A form bound to the POST data
        # if form.is_valid(): # All validation rules pass
    else:
        return HttpResponse("Invalid non POST call to link_bgg!")

def submit_images(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)

        if form.is_valid():

            uuid = form.cleaned_data["uuid"]
            image_num = form.cleaned_data["image_num"]
            file = request.FILES['file']
            try:
                if image_num == 1:
                    FearItem.objects.update_or_create(item_id=uuid, defaults={"image_1": file})
                else:
                    FearItem.objects.update_or_create(item_id=uuid, defaults={"image_2": file})
                return JsonResponse({"success": True, "type":"image", "image_num":image_num})
            except Exception as e:
                return JsonResponse({"success": False, "type":"image", "image_num":image_num, "error":str(e)})

        else:
            print(form.errors)
            return JsonResponse({"success": False, "type":"image", "error":str(form.errors)})

        # form = LinkBggForm(request.POST) # A form bound to the POST data
        # if form.is_valid(): # All validation rules pass
    else:
        return HttpResponse("Invalid non POST call to link_bgg2!")
