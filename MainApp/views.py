from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse, JsonResponse
from .forms import SubmissionForm, UploadFileForm
from .models import FearItem

from django.contrib.auth.decorators import user_passes_test

def index(request):
    # return HttpResponse("Hello, the visualization for this artwork is still under development. Go to <a href='/submit'>this page</a> to submit an entry!")
    filtered_fear_items = FearItem.objects.exclude(valid=False).order_by("-date_created")
    context = {"fear_items": filtered_fear_items}
    return render(request, 'MainApp/index.html', context)


def submissions(request):
    filtered_fear_items = FearItem.objects.exclude(valid=False).order_by("-date_created")
    context = {"fear_items": filtered_fear_items}
    return render(request, 'MainApp/submissions.html', context)

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
