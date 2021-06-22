# Image Search Deployment with AWS

## Introduction
Using various AWS services, I built a JavaScript web application hosted on S3 to perform visual search of an image and return *k* most similar images from a set of approximately 30,000 images.

## Walk-Through
The homepage lists a set of albums containing images grouped by type from which to pick the image for visual search.<sup>1</sup>

| ![home.jpg](images/home.png) | 
|:--:| 
| *Home* |

Selecting an album (e.g. marble) will render a page with images that belong in the selected album. The user can then select the number of desired similar images (i.e. *k*) from a drop-down menu and then select the image on which to perform visual search. The values of *k* that are allowed ranges from 1 to 10.

| ![album.jpg](images/album.png) | 
|:--:| 
| *Album Example* |

Once *k* (e.g. 5) is chosen, selecting an image (e.g. MYPDF.jpg) invokes a Lambda function, which performs the following actions:

- Log into an EC2 instance
- Execute a python script for visual search, which returns a list of paths for similar images in another bucket
- Execute a bash script to copy similar images to public bucket
- Return with location of copied images

A page is then rendered with the selected image, and a row of similar images beneath it. This process takes about 30 seconds per search, which I believe could be faster.

| ![result.jpg](images/result.png) | 
|:--:| 
| *Similar Images* |

## AWS Implementation
The AWS services used and their connections for creating the application are shown below.<sup>2,3</sup> In the process of building this application, listed below are facets of AWS that I began to develop familiarity with:

- S3 bucket permissions: Only the bucket hosting the website is accessible to the public
- Sizing compute:
	- Through trial and error, I determined that the t3.medium instance had the specs necessary for performing search; an 8 GB EBS volume is attached to it
	- I wanted the cheapest instance possible for accomplishing the task
	- t3.nano, t3.micro, and t3.small would exit with errors; I am under the impression that memory size was an issue
- IAM roles and policies:
	- The Lambda function and EC2 instance were given roles with policies attached to access other AWS services
	- I need to explore further how S3 bucket policies and IAM policies work together

<object data="images/diagram.pdf" type="application/pdf" width="700px">
    <embed src="iamges/diagram.pdf">
        <p>This browser does not support PDFs. Please download the PDF to view it: <a href="images/diagram.pdf">Download PDF</a>.</p>
    </embed>
</object>

1. https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html
2. https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-lambda-functions.html
3. https://aws.amazon.com/blogs/compute/scheduling-ssh-jobs-using-aws-lambda/
