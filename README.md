# Image Search Deployment with AWS

## Introduction
Using various AWS services, I built a JavaScript web application hosted on S3 to perform visual search of an image and return *k* most similar images from a set of approximately 30,000 images.

## Walk-Through
The homepage lists a set of albums containing images grouped by type from which to pick the image for visual search.<sup>1</sup>

| ![home.jpg](images/home.png) | 
|:--:| 
| *Home* |

Selecting an album (e.g. marble) will render a page with images that belong in the selected album. The user can then select the number of desired similar images (i.e. *k*) from a drop-down menu and then select the image on which to perform visual search. The values of *k* that are allowed ranges from 1 to 10.

1. https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html
