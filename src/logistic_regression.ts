import { TensorScriptOptions, TensorScriptProperties, Matrix, TensorScriptLayers, } from './model_interface';
import { BaseNeuralNetwork, } from './base_neural_network';

/**
 * Logistic Regression Classification with Tensorflow
 * @class LogisticRegression
 * @implements {BaseNeuralNetwork}
 */
export class LogisticRegression extends BaseNeuralNetwork {
  /**
   * @param {{layers:Array<Object>,compile:Object,fit:Object}} options - neural network configuration and tensorflow model hyperparameters
   * @param {{model:Object,tf:Object,}} properties - extra instance properties
   */
  constructor(options:TensorScriptOptions = {}, properties?:TensorScriptProperties) {
    const config = Object.assign({
      layers: [],
      type:'simple',
      compile: {
        loss: 'meanSquaredError',
        optimizer: 'rmsprop',
      },
      fit: {
        epochs: 100,
        batchSize: 5,
      },
    }, options);
    super(config, properties);
    this.type = 'LogisticRegression';
    return this;
  }
  /**
   * Adds dense layers to tensorflow classification model
   * @override 
   * @param {Array<Array<number>>} x_matrix - independent variables
   * @param {Array<Array<number>>} y_matrix - dependent variables
   * @param {Array<Object>} layers - model dense layer parameters
   * @param {Array<Array<number>>} x_test - validation data independent variables
   * @param {Array<Array<number>>} y_test - validation data dependent variables
   */
  generateLayers(x_matrix:Matrix, y_matrix:Matrix, layers:TensorScriptLayers, x_test:Matrix, y_test:Matrix) {
    const xShape = this.getInputShape(x_matrix);
    const yShape = this.getInputShape(y_matrix);
    this.yShape = yShape;
    this.xShape = xShape;
    const denseLayers = [];
    if (layers) {
      denseLayers.push(...layers);
    } else if (this.settings.type==='class' && this.settings.compile) { 
      denseLayers.push({ units: 1, inputDim:  xShape[ 1 ], activation: 'sigmoid', });
      this.settings.compile.loss = 'binaryCrossentropy';
    } else if (this.settings.type === 'l1l2' && this.settings.compile) { 
      const kernelRegularizer = this.tf.regularizers.l1l2({ l1: 0.01, l2: 0.01, });
      denseLayers.push({ units: 1, inputDim:  xShape[ 1 ], activation: 'sigmoid', kernelRegularizer, });
      this.settings.compile.loss = 'binaryCrossentropy';
    } else {
      denseLayers.push({ units: 1, inputShape: [xShape[1], ], });
    }
    this.layers = denseLayers;
    denseLayers.forEach(layer => {
      this.model.add(this.tf.layers.dense(layer));
    });
    /* istanbul ignore next */
    if (x_test && y_test && this.settings && this.settings.fit) {
      this.settings.fit.validationData = [x_test, y_test];
    }
  }
}