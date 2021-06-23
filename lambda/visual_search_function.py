import boto3
import paramiko
import time
def visual_search_handler(event, context):

    s = time.time()
    print "Downloading key..."
    s3_client = boto3.client('s3')
    #Download private key file from secure S3 bucket
    s3_client.download_file('visual-search-access','coursera.pem', '/tmp/keyname.pem')
    print "Successfully downloaded key"
    print('{0:.3f}s elapsed'.format(time.time()-s))

    pkey = paramiko.RSAKey.from_private_key_file("/tmp/keyname.pem")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    s = time.time()
    #host=event['IP']
#    host='ec2-34-230-51-97.compute-1.amazonaws.com'
    host='ec2-18-209-112-165.compute-1.amazonaws.com'
    print "Connecting to " + host
    c.connect( hostname = host, username = "ec2-user", pkey = pkey )
    print "Connected to " + host
    print('{0:.3f}s elapsed'.format(time.time()-s))
    photo_url = event['photoUrl']
    photo_url = 's3://visual-search-public/'+photo_url.split('/')[-1].replace('%2F','/')
    photo_name = event['photoName'] 
    k = str(event['k'])

    #photo_name = photo_url.split('%2F')[-1]
    commands = [
	#"aws s3 rm s3://visual-search-public/results/" + photo_name + "  --recursive",
        "aws s3 cp " + photo_url + " download/" + photo_name,
	#"source ~/anaconda3/etc/profile.d/conda.sh",
#        "conda activate mxnet && python visual-search-minimal.py download/" + photo_name + " " + k + " > visual-search.out",
        "conda activate mxnet && python visual-search-minimal.py download/" + photo_name + " " + k,
#        "./load_result.sh"
        ]
    for i, command in enumerate(commands):
        s = time.time()
        print "Executing {}".format(command)
        stdin , stdout, stderr = c.exec_command(command)
        print stdout.read()
        print stderr.read()
        print('{0:.3f}s elapsed'.format(time.time()-s))

#    return {'album' : "results/"}
    return {'photo_key' : stdout}
