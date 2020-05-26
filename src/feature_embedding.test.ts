import util from 'util';
import path from 'path';
import * as ms from '@modelx/data';
import * as jskp from 'jskit-plot';
import { FeatureEmbedding, } from './index';
import '@tensorflow/tfjs-node';
import * as tf from '@tensorflow/tfjs-node';
import { stop_words, norm_bible, norm_bible_matrix, products, furniture } from './test/mock/data/stopwords';
const FeatureDS:any = {};
const ContextPairs: any = {};
let FE;
let FEModel;
let FEweights;

// console.log({ norm_bible_matrix });
/** @test {FeatureEmbedding} */
describe('FeatureEmbedding', function () {
  beforeAll(async function () {
    const ds = await FeatureEmbedding.getFeatureDataSet({
      inputMatrixFeatures: norm_bible_matrix,
    });
    
    FeatureDS.featureToId = ds.featureToId;
    FeatureDS.IdToFeature = ds.IdToFeature;
    FeatureDS.featureIds = ds.featureIds;
    FeatureDS.numberOfFeatures = ds.numberOfFeatures;
    // console.log('FeatureDS',FeatureDS);
    // console.log('wids',wids);
    
    const cxt = await FeatureEmbedding.getContextPairs({
      tf,
      numberOfFeatures: FeatureDS.numberOfFeatures,
      inputMatrix: FeatureDS.featureIds
    });
    ContextPairs.context_length = cxt.context_length;
    ContextPairs.emptyXVector = cxt.emptyXVector;
    ContextPairs.emptyYVector = cxt.emptyYVector;
    ContextPairs.x = cxt.x;
    ContextPairs.y = cxt.y;
    // console.log({ ContextPairs });
    // console.log('ContextPairs.x',ContextPairs.x);
    // console.log('ContextPairs.y',ContextPairs.y);

    // nnClassification = new FeatureEmbedding({ fit, });
    FEModel = new FeatureEmbedding({});
    await FEModel.train(norm_bible_matrix);
    FEweights = await FEModel.predict();

  }, 120000);
  /** @test {FeatureEmbedding#getFeatureDataSet} */
  describe('static getFeatureDataSet', () => {
    it('should assign each feature to an ID', () => {
      expect(FeatureDS.featureToId.PAD).toBe(0);
      expect(FeatureDS.featureToId.food).toBe(1);
    });
    it('should assign each ID to a feature', () => {
      expect(FeatureDS.IdToFeature[0]).toBe('PAD');
      expect(FeatureDS.IdToFeature[1]).toBe('food');
    });
    it('should convert list of features to ids', () => {
      FeatureDS.featureIds.forEach(feats => {
        feats.forEach(feat => {
          expect(typeof feat).toBe('number');
        });
      });
      expect(Object.values(FeatureDS.featureToId).includes(FeatureDS.featureIds[0][0])).toBe(true);
    });
    it('should calculate total number of features', () => {
      expect(Array.from(new Set(FeatureDS.featureIds.flat())).length).toBe(Object.values(FeatureDS.featureToId).length - 1);
    });
  });
  /** @test {FeatureEmbedding#getContextPairs} */
  describe('static getContextPairs', () => {

    it('should assign window size and context_length', async () => {
      const cl6 = await FeatureEmbedding.getContextPairs({ inputMatrix: [[]], numberOfFeatures: 4, window_size: 3 });
      const cl10 = await FeatureEmbedding.getContextPairs.call({ settings: { windowSize: 5, } }, { inputMatrix: [[]], numberOfFeatures: 4, window_size: 3 });
      expect(cl6.context_length).toBe(6);
      expect(cl10.context_length).toBe(10);
      expect(ContextPairs.context_length).toBe(4);
    });
    it('should create empty vectors', () => {
      expect(ContextPairs.emptyXVector).toMatchObject([0, 0, 0, 0]);
      expect(ContextPairs.emptyYVector).toMatchObject([
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0
      ]);
    });
    it('should training matrices', () => {
      expect(ContextPairs.x[0]).toMatchObject([0, 0, 2, 3]);
      expect(ContextPairs.y[0]).toMatchObject([
        0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0
      ]);
    });
  });
  /** @test {FeatureEmbedding#getMergedArray} */
  describe('static getMergedArray', () => {
    it('should merge two arrays', () => {
      const b = [0, 0, 0, 0];
      const m = [1, 2];
      const b1 = [0, 0, 0, 0];
      const m1 = [];
      const b2 = [0, 0];
      const m2 = [5, 6, 7, 8];
      const merged = FeatureEmbedding.getMergedArray(b, m);
      const merged1 = FeatureEmbedding.getMergedArray(b1, m1);
      const merged2 = FeatureEmbedding.getMergedArray(b2, m2);
      expect(merged).toMatchObject([1, 2, 0, 0]);
      expect(merged1).toMatchObject([0, 0, 0, 0]);
      expect(merged2).toMatchObject([5, 6, 7, 8]);
    });
    it('should append and merge two arrays', () => {
      const b = [0, 0, 0, 0];
      const m = [1, 2];
      const b1 = [0, 0, 0, 0];
      const m1 = [];
      const b2 = [0, 0];
      const m2 = [5, 6, 7, 8];
      const merged = FeatureEmbedding.getMergedArray(b, m, true);
      const merged1 = FeatureEmbedding.getMergedArray(b1, m1, true);
      const merged2 = FeatureEmbedding.getMergedArray(b2, m2, true);
      // console.log({merged,merged1,merged2})
      expect(merged).toMatchObject([0, 0, 1, 2,]);
      expect(merged1).toMatchObject([0, 0, 0, 0]);
      expect(merged2).toMatchObject([5, 6, 7, 8]);
    });
    it('should handle empty arrays', () => {
      const merged = FeatureEmbedding.getMergedArray();
      expect(merged).toMatchObject([]);
    });
  });
  /** @test {FeatureEmbedding#constructor} */
  describe('constructor', () => {
    it('should export a named module class', () => {
      const FE = new FeatureEmbedding();
      //@ts-ignore
      const FEConfigured = new FeatureEmbedding({ test: 'prop', });
      expect(typeof FeatureEmbedding).toBe('function');
      expect(FE).toBeInstanceOf(FeatureEmbedding);
      expect(FEConfigured.settings.test).toBe('prop');
    });
  });
  describe('generate feature embedder', () => {
    it('should train a model and get embedding weights', async () => {
      const FE = new FeatureEmbedding({
        windowSize: 3,
        fit: {
          epochs: 25,
          batchSize: 1,
          callbacks: {
            onTrainEnd: (logs: any) => console.log('onTrainEnd', { logs, }),
            onEpochBegin: (epoch: number, logs: any) => console.log('onEpochBegin', { logs, epoch, }),
          }
        },
      });
      // console.log({furniture})
      // await FE.train(furniture);
      await FE.train(products);
      const weights = await FE.predict();
      const firstFeature = Object.keys(FE.featureToId)[0];
      expect(weights[0].length).toBe(FE.settings.embedSize);
    })
  })
  /** @test {FeatureEmbedding#labelWeights} */
  describe('labelWeights', () => {
    it('should label weights from model featureToId', async () => {
      const weights = FEweights;
      const labeled = FEModel.labelWeights(weights);
      const firstFeature = Object.keys(FEModel.featureToId)[0];
      expect(labeled[firstFeature].length).toBe(FEModel.settings.embedSize);
      /**
       * labeledFEweights: {
        PAD: [
             0.08473291248083115,   0.06016451492905617,   -0.09881442785263062,
...
            -0.02249222621321678,   0.06540007144212723
        ],
        food: [
          -0.19053350389003754,   0.12037993222475052,   0.2405654937028885,
...
           0.16511322557926178,  -0.10890625417232513
        ],
       */
    });
  });
  /** @test {FeatureEmbedding#findSimilarFeatures} */
  describe('findSimilarFeatures', () => {
    it('should finish test', async () => {
      const labeledFEweights = FEModel.labelWeights(FEweights);
      const sims = await FEModel.findSimilarFeatures(FEweights, { limit: 10, labeledWeights: labeledFEweights, features: ['car', 'food', 'tesla'] });
      // console.log('sims', util.inspect(sims, { depth: 20 }));
      expect(Object.keys(sims.car[0])).toMatchObject(['comparedFeature', 'proximity', 'distance'])
      expect(sims.car[0].distance).toBeGreaterThanOrEqual(-1);
      expect(sims.car[0].distance).toBeLessThanOrEqual(1);
      expect(sims.car[0].proximity).toBeGreaterThanOrEqual(-1);
      expect(sims.car[0].proximity).toBeLessThanOrEqual(1);
      /**
       * {
        car: [
            {
              comparedFeature: 'far',
              proximity: -0.5087087154388428,
              distance: 0.03015853278338909
            },
            {
              comparedFeature: 'solve',
              proximity: -0.3032159209251404,
              distance: 0.036241017282009125
            },
            {
              comparedFeature: 'use',
              proximity: -0.0551472045481205,
              distance: 0.04211376607418
            }
          ]
        }
       */
    });
  });
  /** @test {FeatureEmbedding#reduceWeights} */
  describe('reduceWeights', () => {
    it('should reduce dimensions with tSNE', async () => {
      const reducedWeights = await FEModel.reduceWeights(FEweights);
      const reducedlabeled = FEModel.labelWeights(reducedWeights);
      const firstFeature = Object.keys(FEModel.featureToId)[0];
      expect(reducedlabeled[firstFeature].length).toBe(2);
      const reducedWeights3D = await FEModel.reduceWeights(FEweights,{dim:3});
      const reducedlabeled3D = FEModel.labelWeights(reducedWeights3D);
      expect(reducedlabeled3D[firstFeature].length).toBe(3);
      /**
       * 
       * {
      reducedlabeled: {
        chair_9: [ 10.00498986402913, -54.73530312852864 ],
...
        table_8: [ 13.780806410847555, -9.625880855940855 ],
        table_9: [ 54.456409915437945, 8.619291671361108 ]
      }
    }
       * 
       */
    });
  });
  /** @test {FeatureEmbedding#generateLayers} */
  describe('generateLayers', () => {
    it('should generate embedding layers',async () =>{6
      FE = new FeatureEmbedding({
        windowSize: 3,
        fit: {
          epochs: 2,
          batchSize: 1,
          callbacks: {
            // onTrainBegin: (logs:any) => console.log('onTrainBegin',{logs, }),
            // // called when training ends.
            onTrainEnd: (logs: any) => console.log('onTrainEnd', { logs, }),
            // //called at the start of every epoch.
            onEpochBegin: (epoch: number, logs: any) => console.log('onEpochBegin', { logs, epoch, }),
            // //called at the end of every epoch.
            // onEpochEnd: (epoch: number, logs: any) => console.log('onEpochEnd',{logs, epoch, }),
            // //called at the start of every batch.
            // onBatchBegin:(batch:number, logs: any)=> console.log('onBatchBegin',{logs,  batch}),
            // //called at the end of every batch.
            // onBatchEnd:(batch:number, logs: any)=> console.log('onBatchEnd',{logs,  batch}),
            // //called every yieldEvery milliseconds with the current epoch, batch and logs. The logs are the same as in onBatchEnd(). Note that onYield can skip batches or epochs. See also docs for yieldEvery below.
            // onYield:(epoch:number, batch:number, logs: any)=> console.log('onYield',{logs, epoch, batch}),
          }
        },
      });
      // console.log({furniture})
      // await FE.train(furniture);
      await FE.train(products);
      expect(FE.layers).toHaveLength(3);
    });
    it('should generate a network from layers', async () => { 
      const FECustom = new FeatureEmbedding({ layerPreference:'custom', });
      await FECustom.train(norm_bible_matrix, FEModel.layers);
      // console.log('FECustom.layers',FECustom.layers)
      expect(FECustom.layers).toHaveLength(3);
    },120000);
  });
});