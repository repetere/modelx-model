import { TensorScriptModelInterface, TensorScriptOptions, TensorScriptProperties, Matrix, Vector, TensorScriptLayers, TensorScriptSavedLayers, PredictionOptions, } from './model_interface';

/**
 * Deep Learning with Tensorflow
 * @class BaseNeuralNetwork
 * @implements {TensorScriptModelInterface}
 */
export class BaseNeuralNetwork extends TensorScriptModelInterface {
  /**
   * @param {{layers:Array<Object>,compile:Object,fit:Object}} options - neural network configuration and tensorflow model hyperparameters
   * @param {{model:Object,tf:Object,}} properties - extra instance properties
   */
  constructor(options:TensorScriptOptions = {}, properties?:TensorScriptProperties) {
    const config = Object.assign({
      layers: [],
      compile: {
        loss: 'meanSquaredError',
        optimizer: 'adam',
      },
      fit: {
        epochs: 100,
        batchSize: 5,
        verbose:0,
      },
    }, options);
    super(config, properties);
    this.type = 'BaseNeuralNetwork';
    return this;
  }
  /**
   * Adds dense layers to tensorflow model
   * @abstract 
   * @param {Array<Array<number>>} x_matrix - independent variables
   * @param {Array<Array<number>>} y_matrix - dependent variables
   * @param {Array<Object>} layers - model dense layer parameters
   */
  generateLayers(x_matrix:Matrix, y_matrix:Matrix, layers?:TensorScriptLayers|TensorScriptSavedLayers, x_test?:Matrix, y_test?:Matrix): void 
  generateLayers(this:TensorScriptModelInterface, x_matrix: Matrix, layers?: TensorScriptLayers | TensorScriptSavedLayers|any){
    throw new ReferenceError('generateLayers method is not implemented');
  }
  /**
   * Asynchronously trains tensorflow model
   * @override
   * @param {Array<Array<number>>} x_matrix - independent variables
   * @param {Array<Array<number>>} y_matrix - dependent variables
   * @param {Array<Object>} layers - array of model dense layer parameters
   * @param {Array<Array<number>>} x_text - validation data independent variables
   * @param {Array<Array<number>>} y_text - validation data dependent variables
   * @return {Object} returns trained tensorflow model 
   */
  async train(x_matrix:Matrix, y_matrix:Matrix, layers?:TensorScriptLayers, x_test?:Matrix, y_test?:Matrix) {
    const xShape = this.getInputShape(x_matrix);
    const yShape = this.getInputShape(y_matrix);
    const xs = this.tf.tensor(x_matrix, xShape);
    const ys = this.tf.tensor(y_matrix, yShape);
    this.xShape = xShape;
    this.yShape = yShape;
    if (typeof this.compiled==='undefined' || this.compiled === false) {
      this.model = this.tf.sequential();
      this.generateLayers.call(this, x_matrix, y_matrix, layers || this.layers, x_test, y_test);
      this.model.compile(this.settings.compile);
      this.compiled = true;
    }
    await this.model.fit(xs, ys, this.settings.fit);
    this.trained = true;
    xs.dispose();
    ys.dispose();
    return this.model;
  }
  /**
   * Predicts new dependent variables
   * @override
   * @param {Array<Array<number>>|Array<number>} matrix - new test independent variables
   * @param {Object} options - model prediction options
   * @return {{data: Promise}} returns tensorflow prediction 
   */
  calculate(input_matrix:Matrix|Vector, options?:PredictionOptions) {
    if (!input_matrix || Array.isArray(input_matrix)===false) throw new Error('invalid input matrix');
    const predictionInput = (Array.isArray(input_matrix[ 0 ]))
      ? input_matrix
      : [
        input_matrix,
      ];
    const predictionTensor = this.tf.tensor(predictionInput);
    const prediction = this.model.predict(predictionTensor, options);
    predictionTensor.dispose();
    return prediction;
  }
}