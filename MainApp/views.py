from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse, JsonResponse
from .forms import SubmissionForm, UploadFileForm
from .models import FearItem, FearImage

def index(request):
    return HttpResponse("Hello, this site is still under development.")

def viz(request):
    filtered_fear_items = FearItem.objects.exclude(valid=False)
    context = {"fear_items": filtered_fear_items}
    return render(request, 'MainApp/index.html', context)

def submit(request):
    context = {'form':SubmissionForm()}
    return render(request, 'MainApp/submit.html', context)

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

            try:
                defaults = {
                    "send_email": send_email,
                    "email": email,
                    "gender": gender,
                    "age": age,
                    "country": country,
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
            image_type = form.cleaned_data["image_type"]
            file = request.FILES['file']
            try:
                if image_type == "image":
                    (fear_item, created) = FearItem.objects.update_or_create(item_id=uuid)

                    FearImage.objects.create(fear_item=fear_item, image_file=file)
                else:
                    FearItem.objects.update_or_create(item_id=uuid, defaults={"text_file": file})
                return JsonResponse({"success": True, "type":"image", "image_type":image_type})
            except Exception as e:
                return JsonResponse({"success": False, "type":"image", "image_type":image_type, "error":str(e)})

        else:
            print(form.errors)
            return JsonResponse({"success": False, "type":"image", "error":str(form.errors)})

        # form = LinkBggForm(request.POST) # A form bound to the POST data
        # if form.is_valid(): # All validation rules pass
    else:
        return HttpResponse("Invalid non POST call to link_bgg2!")
