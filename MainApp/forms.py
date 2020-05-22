from django import forms
# from users.models import Profile
from datetime import datetime
from crispy_forms.helper import FormHelper
from django_countries import countries
COUNTRY_CHOICES = list(countries)
COUNTRY_CHOICES.insert(0, ("-","-"))
COUNTRY_CHOICES = tuple(COUNTRY_CHOICES)

START_YEAR = 1940
class SubmissionForm(forms.Form):

    consent_text = "I consent to my drawings and writings being included as part of the web-based community artwork - Fear Maps"
    email_text = "I would like to receive a URL link to view my drawing as part of the web-based community artwork - Fear Maps"

    consent_checkbox = forms.CharField(widget=forms.CheckboxInput(), label=consent_text, required=True)
    email_checkbox = forms.CharField(widget=forms.CheckboxInput(), label=email_text, required=False)

    email = forms.EmailField(widget=forms.EmailInput(), required=False, max_length = 256)
    gender = forms.CharField(widget=forms.TextInput(), label="Gender", required=False, max_length = 256)
    age = forms.IntegerField(widget=forms.NumberInput(), label="Age", required=False)
    country = forms.ChoiceField(choices=COUNTRY_CHOICES, required=False, label="Country")

    fear_text = forms.CharField(widget=forms.Textarea(), label="", required=True)
    fear_colors_text = forms.CharField(widget=forms.Textarea(), label="", required=True)

    uuid = forms.UUIDField(widget=forms.HiddenInput())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        # self.helper.form_id = 'id-myModelForm'
        # self.helper.form_class = 'form-horizontal'
        # self.helper.form_action = 'my_model_form_url'
        # self.helper.form_error_title = 'Form Errors'
        # self.helper.help_text_inline = True

class UploadFileForm(forms.Form):
    uuid = forms.UUIDField()
    image_num = forms.IntegerField()
    file = forms.FileField()
