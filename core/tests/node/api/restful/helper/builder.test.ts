import { chatCompletions, getBuilder } from '../../../../../src/node/api/restful/helper/builder';

import { FastifyRequest, FastifyReply } from 'fastify';
import { existsSync, readdirSync, readFileSync } from 'fs';
import fetch from 'node-fetch';
import { join } from 'path';

jest.mock('node-fetch');
const { Response: FetchResponse } = jest.requireActual('node-fetch');
jest.mock('fs');
jest.mock('path');
jest.mock('electron')
jest.mock('../../../../../src/node/helper',() => ({
    getJanDataFolderPath: jest.fn(() => '/mock/path'),
    getEngineConfiguration: jest.fn(() => ({ engine: 'test' })),
}));

describe('builder', () => {

    const mockConfiguration = {
        dirName: 'models',
        metadataFileName: 'metadata.json',
        delete: {
            object: 'test'
        }
      };
    
      const mockDirectoryPath = '/mock/path/models';
      const mockFiles = ['model1', 'model2', '.DS_Store'];
      const mockMetadata = [{
        id: 'model1',
        name: 'Test Model 1',
        engine: 'nitro',
        delete: {
            object: 'test'
        }
      },{
        id: 'model2',
        name: 'Test Model 2',
        engine: 'openai'
      }];
    
      beforeAll(() => {
        (join as jest.Mock).mockImplementation((...args) => args.join('/'));
      });

      afterAll(() => {
        jest.clearAllMocks();
      });

describe('getBuilder', () => {

  it('should return an empty array if the directory does not exist', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const result = await getBuilder(mockConfiguration);

    expect(result).toEqual([]);
    expect(existsSync).toHaveBeenCalledWith(mockDirectoryPath);
  });

  it('should return an empty array if no valid metadata files are found', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue(mockFiles);
    (readFileSync as jest.Mock).mockReturnValue(undefined);

    const result = await getBuilder(mockConfiguration);

    expect(result).toEqual([]);
    expect(existsSync).toHaveBeenCalledWith(mockDirectoryPath);
    expect(readdirSync).toHaveBeenCalledWith(mockDirectoryPath);
  });

  it('should return parsed metadata for valid files', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue(mockFiles);
    (readFileSync as jest.Mock).mockImplementation((path) => {
      if (path.includes('model1')) {
        return JSON.stringify(mockMetadata[0]);
      }
      if (path.includes('model2')) {
        return JSON.stringify(mockMetadata[1]);
      }
      throw new Error('File not found');
    });

    const result = await getBuilder(mockConfiguration);

    expect(result).toEqual([
    	{
    	  id: 'model1',
    	  name: 'Test Model 1',
    	  engine: 'nitro',
    	  delete: {
    	    object: 'test'
    	  }
    	},
    	{
    	  id: 'model2',
    	  name: 'Test Model 2',
    	  engine: 'openai'
    	}
    ]);
    expect(existsSync).toHaveBeenCalledWith(mockDirectoryPath);
    expect(readdirSync).toHaveBeenCalledWith(mockDirectoryPath);
  });

  it('should handle JSON parsing errors gracefully', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue(mockFiles);
    (readFileSync as jest.Mock).mockImplementation((path) => {
      if (path.includes('model1')) {
        return 'invalid JSON';
      }
      if (path.includes('model2')) {
        return JSON.stringify({ id: 'model2', name: 'Test Model 2' });
      }
      throw new Error('File not found');
    });

    const result = await getBuilder(mockConfiguration);

    expect(result).toEqual([{ id: 'model2', name: 'Test Model 2'}]);
    expect(existsSync).toHaveBeenCalledWith(mockDirectoryPath);
    expect(readdirSync).toHaveBeenCalledWith(mockDirectoryPath);
  });
});
describe('chatCompletions', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockResponse: Partial<FastifyReply>;

  beforeEach(() => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue(mockFiles);
    (readFileSync as jest.Mock).mockImplementation((path) => {
      if (path.includes('model1')) {
        return JSON.stringify(mockMetadata[0]);
      }
      if (path.includes('model2')) {
        return JSON.stringify(mockMetadata[1]);
      }
      throw new Error('File not found');
    });

    mockRequest = {
      body: {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
      },
      params: {
        modelId: 'test-model-id',
      },
    };

    mockResponse = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
      statusCode: 400,
      status: 400,
      raw:{
        writeHead: jest.fn(),
      }
    } as any
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if model does not exist', async () => {
    // Mock fetch to return a 404 response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new FetchResponse(null, { status: 400 })
    );

    await chatCompletions(mockRequest as FastifyRequest, mockResponse as FastifyReply);

    expect(mockResponse.code).toHaveBeenCalledWith(404);
    expect(mockResponse.send).toHaveBeenCalledWith({
      error: {
        message: 'The model test-model does not exist',
        type: 'invalid_request_error',
        param: null,
        code: 'model_not_found',
      },
    });
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  it('should return 200 and pipe response if successful', async () => {
    // Mock fetch to return a 200 response
    const mockFetchResponse = new FetchResponse(JSON.stringify({ success: true }), { status: 200 });

    // Correctly mock the body as a ReadableStream
    jest.spyOn(mockFetchResponse, 'body', 'get').mockReturnValue({
      pipe: jest.fn(),
    } as any);

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockFetchResponse);
    (mockRequest.body as any).model = 'model1';
    await chatCompletions(mockRequest as FastifyRequest, mockResponse as FastifyReply);

    expect(mockResponse!.raw!.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    
    // Ensure the pipe method is called correctly
    expect(mockFetchResponse.body.pipe).toHaveBeenCalledWith(mockResponse.raw);
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });
  it('should add engine field to the request body when engine is nitro', async () => {
    // Mock fetch to return a 200 response
    const mockFetchResponse = new FetchResponse(JSON.stringify({ success: true }), { status: 200 });

    // Correctly mock the body as a ReadableStream
    jest.spyOn(mockFetchResponse, 'body', 'get').mockReturnValue({
      pipe: jest.fn(),
    } as any);

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockFetchResponse);
    (mockRequest.body as any).model = 'model1';
    await chatCompletions(mockRequest as FastifyRequest, mockResponse as FastifyReply);

    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:3928/inferences/server/chat_completion', {
      body: JSON.stringify({
        model: 'model1',
        messages: [{ role: 'user', content: 'Hello' }],
        engine: 'cortex.llamacpp',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  it('should not add engine field to the request body when engine is not nitro', async () => {
    // Mock fetch to return a 200 response
    const mockFetchResponse = new FetchResponse(JSON.stringify({ success: true }), { status: 200 });

    // Correctly mock the body as a ReadableStream
    jest.spyOn(mockFetchResponse, 'body', 'get').mockReturnValue({
      pipe: jest.fn(),
    } as any);

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockFetchResponse);
    (mockRequest.body as any).model = 'model2';
    await chatCompletions(mockRequest as FastifyRequest, mockResponse as FastifyReply);

    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:3928/inferences/server/chat_completion', {
        body: JSON.stringify({
          model: 'model2',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      (fetch as jest.MockedFunction<typeof fetch>).mockClear();
    });
});
});