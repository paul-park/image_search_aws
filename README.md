# Image Search Deployment with AWS

## Introduction
Using various AWS services, I built a [JavaScript web application hosted on S3](http://image-search-public.s3-website-us-east-1.amazonaws.com/) to perform search of an image and return *k* most similar images from a set of approximately 30,000 images.

## Walk-Through
The homepage lists a set of albums containing images grouped by type from which to pick the image for visual search.<sup>1</sup>

| ![home.jpg](images/home.png) | 
|:--:| 
| *Home* |

Selecting an album (e.g. marble) will render a page with images that belong in the selected album. The user can then select the number of desired similar images (i.e. *k*) from a drop-down menu and then select the image on which to perform visual search. The values of *k* that are allowed range from 1 to 10.

| ![album.jpg](images/album.png) | 
|:--:| 
| *Album Example* |

Once *k* (e.g. 5) is chosen, selecting an image (e.g. MYPDF.jpg) invokes a Lambda function, which performs the following actions:

- Log into an EC2 instance
- Execute a python script for visual search, which returns a list of paths for similar images in another bucket
- Execute a bash script to copy similar images to public bucket
- Return with location of copied images

A page is then rendered with the selected image, and a row of similar images beneath it.

| ![result.jpg](images/result.png) | 
|:--:| 
| *Similar Images* |

## AWS Implementation
The AWS services used and their connections for creating the application are shown <a href="images/diagram.pdf">here</a>.<sup>2,3</sup> In the process of building this application, listed below are facets of AWS that I began to develop familiarity with:

- S3 bucket permissions: Only the bucket hosting the website is accessible to the public
- Sizing compute:
	- Through trial and error, I determined that the t3.medium instance had the specs necessary for performing search; an 8 GB EBS volume is attached to it
	- I wanted the cheapest instance possible for accomplishing the task
	- t3.nano, t3.micro, and t3.small would exit with errors; I am under the impression that memory size was an issue
- IAM roles and policies:
	- The Lambda function and EC2 instance were given roles with policies attached to access other AWS services
	- I need to explore further how S3 bucket policies and IAM policies work together

## Visual Search
My initial approach had been to use SageMaker and run a k-NN algorithm,<sup>4</sup> but I then decided that the application needed to give the user flexibility for choosing *k* without having to retrain the k-NN model. So I kept the portion of a pretrained ResNet-50 model imported from MXNet that performs feature extraction, and fed the extracted features through a locality sensitive hashing (LSH) algorithm.<sup>5,6</sup> The hash table of approximately 30,000 images was saved to a pickle file (530 MB). Parameters for feature extraction were also saved (90 MB) to be used later.

The hash table, feature extraction parameters, and python script that extracts features from an input image and queries the hash table with the extracted features were uploaded to the EC2 instance, which was used by the Lambda function to perform the search.

## Performance
The Lambda run time seems dependent on *k*, based on several runs:

| Trial | *k* | Download Key | SSH into EC2 | Download Selected Image from S3 | Execute LSH Search | Upload Results | Total Time |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:| 
| 1 | 1 | 3.5s | 0.5s | 1s | 6s | 1.5s | 12s |
| 2 | 10 | 0.5s | 0.15s | 1s | 6s | 7.8s | 15.5s |
| 3 | 20 | 0.5s | 0.2s | 1s | 6s | 17.6s | 25s |
| 4 | 1 | 0.5s | 0.2s | 1s | 6s | 1.5s | 9.5s |
| 5 | 10 | 3.2s | 0.2s | 1s | 6s | 8.5s | 19s |

Observations for run times for some of the columns are as follows:

### Download Key
The Lambda function once triggered by an image selection downloads a key to SSH into the EC2 instance. The run times are longer for Trials 1 and 5. I believe this has to do with fact that the Lambda function starts from a cold state. This is not always the case if the Lambda function was triggered initially as shown by Trials 2 through 4. Trial 5 was triggered after some lag -- how long the Lambda function waits before going cold again is something to inspect further.

### Execute LSH Search
The Python script for executing LSH search does the following:
- Load hash table
- Featurize selected image
- Perform LSH search

The bulk of the 6 seconds is taken up by the first step of loading the hash table into memory. This process could be faster if the hash table were always available.

### Upload Results
The variable component in the run time came from the number of similar images that needed to be returned as a result. The Lambda function after executing the Python script for LSH search proceeds to copy the images using aws-cli from an S3 bucket not accessible to the public to the public S3 bucket that hosts the web application. The S3 copy was happening sequentially, so there must be a way to parallelize this to speed up the process.

### Redesign?
In general, I would be first to suspect flaws in the architecture design, and would consider options that do not rely on Lambda using an SSH connection to an EC2 instance.

## Cost
A brief note on cost. 30,000 28x28 images only takes up 35 MB, which is negligible on S3. Most of the cost comes from leaving a t3.medium instance up 24/7, which amounts to about $1 per day. I have yet to check how much a single invocation of the Lambda function costs.

## References
1. https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html
2. https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-lambda-functions.html
3. https://aws.amazon.com/blogs/compute/scheduling-ssh-jobs-using-aws-lambda/
4. https://aws.amazon.com/blogs/machine-learning/visual-search-on-aws-part-1-engine-implementation-with-amazon-sagemaker/
5. https://towardsdatascience.com/finding-similar-images-using-deep-learning-and-locality-sensitive-hashing-9528afee02f5
6. https://towardsdatascience.com/fast-near-duplicate-image-search-using-locality-sensitive-hashing-d4c16058efcb
