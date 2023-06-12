from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
import base64

@method_decorator(csrf_exempt, name='dispatch')
class EditImageView(View):
    def post(self, request):
        image_file = request.FILES['image']
        operation = request.POST['operation']
        img = Image.open(image_file)
        img_cv = np.array(img)
        if operation == 'crop':
            x = int(request.POST['x'])
            y = int(request.POST['y'])
            w = int(request.POST['width'])
            h = int(request.POST['height'])
            img_cv = img_cv[y:y+h, x:x+w]

        if operation == 'resize':
            width = int(request.POST['width'])
            height = int(request.POST['height'])
            img_cv = cv2.resize(img_cv, (width, height))

        img_cv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        _, buffer = cv2.imencode('.png', img_cv)
        image_as_text = base64.b64encode(buffer).decode('utf-8')

        return JsonResponse({'image': image_as_text})
