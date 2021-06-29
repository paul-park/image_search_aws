import sys
import time

s = time.time()
import mxnet as mx
import cv2
import numpy as np
from collections import namedtuple
import pickle
print('{0:.3f}s elapsed to import packages'.format(time.time()-s), file=sys.stderr)

HASH_TABLE_PKL = "lsh.pkl"
FE_CHECKPOINT = "featurizer-v1"

s = time.time()
sym_fe, arg_params_fe, aux_params_fe = mx.model.load_checkpoint(FE_CHECKPOINT, 0)
mod_fe = mx.mod.Module(symbol=sym_fe, context=mx.cpu(), label_names=None)
mod_fe.bind(for_training=False, data_shapes=[('data', (1,3,28,28))])
mod_fe.set_params(arg_params_fe, aux_params_fe)
print('{0:.3f}s elapsed to load featurizer'.format(time.time()-s), file=sys.stderr)


Batch = namedtuple('Batch', ['data'])

def get_image(fname, show=False):
    img = cv2.cvtColor(cv2.imread(fname), cv2.COLOR_BGR2RGB)
    if img is None:
        return None
    if show:
        plt.imshow(img)
        plt.axis('off')
    # convert into format (batch, RGB, width, height)
    img = cv2.resize(img, (28, 28))
    img = np.swapaxes(img, 0, 2)
    img = np.swapaxes(img, 1, 2)
    img = img[np.newaxis, :]
    
    return img

s = time.time()
lsh = pickle.load(open(HASH_TABLE_PKL,'rb'))
print('{0:.3f}s elapsed to load hash table'.format(time.time()-s), file=sys.stderr)

#import glob
#fp_list = glob.glob('geological_test/*/*')

#for fp in fp_list[:5]:
#
#    print(fp)
#    img = get_image(fp)
#    # extract features
#    mod_fe.forward(Batch([mx.nd.array(img)]))
#    features = mod_fe.get_outputs()[0].asnumpy()
#
#    response = lsh.query(features.squeeze(), num_results= 5)
#    for index,r in enumerate(response):
#        fp = r[0][1]
#        print(fp)
#    print()

def main():
    fp = sys.argv[1]
    k = int(sys.argv[2])
    print(fp.split('/')[-1].split('.')[0])
    s = time.time()
    img = get_image(fp)
    print('{0:.3f}s elapsed to load image'.format(time.time()-s), file=sys.stderr)
    # extract features
    s = time.time()
    mod_fe.forward(Batch([mx.nd.array(img)]))
    features = mod_fe.get_outputs()[0].asnumpy()
    print('{0:.3f}s elapsed to featurize'.format(time.time()-s), file=sys.stderr)
    s = time.time()
    response = lsh.query(features.squeeze(), num_results=k)
    print('{0:.3f}s elapsed to hash search'.format(time.time()-s), file=sys.stderr)
    s = time.time()
    for index,r in enumerate(response):
        fp = r[0][1]
        print(fp)
    print()
    print('{0:.3f}s elapsed to print results'.format(time.time()-s), file=sys.stderr)

if __name__=='__main__':
    main()
