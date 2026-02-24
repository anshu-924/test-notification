/**
 * @fileoverview gRPC-Web generated client stub for notification
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck

import * as grpcWeb from 'grpc-web';
import { ConnectionRequest, ConnectionResponse, SubscribeRequest, Notification } from './notification_pb.js';

const grpc = {};
grpc.web = grpcWeb;

const proto = {};
proto.notification = {
  ConnectionRequest,
  ConnectionResponse,
  SubscribeRequest,
  Notification
};

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.notification.NotificationServiceClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options.format = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.notification.NotificationServicePromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options.format = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.notification.ConnectionRequest,
 *   !proto.notification.ConnectionResponse>}
 */
const methodDescriptor_NotificationService_AddConnection = new grpc.web.MethodDescriptor(
  '/notification.NotificationService/AddConnection',
  grpc.web.MethodType.UNARY,
  proto.notification.ConnectionRequest,
  proto.notification.ConnectionResponse,
  /**
   * @param {!proto.notification.ConnectionRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.notification.ConnectionResponse.deserializeBinary
);


/**
 * @param {!proto.notification.ConnectionRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.notification.ConnectionResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.notification.ConnectionResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.notification.NotificationServiceClient.prototype.addConnection =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/notification.NotificationService/AddConnection',
    request,
    metadata || {},
    methodDescriptor_NotificationService_AddConnection,
    callback);
};


/**
 * @param {!proto.notification.ConnectionRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.notification.ConnectionResponse>}
 *     Promise that resolves to the response
 */
proto.notification.NotificationServicePromiseClient.prototype.addConnection =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/notification.NotificationService/AddConnection',
    request,
    metadata || {},
    methodDescriptor_NotificationService_AddConnection);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.notification.ConnectionRequest,
 *   !proto.notification.ConnectionResponse>}
 */
const methodDescriptor_NotificationService_RemoveConnection = new grpc.web.MethodDescriptor(
  '/notification.NotificationService/RemoveConnection',
  grpc.web.MethodType.UNARY,
  proto.notification.ConnectionRequest,
  proto.notification.ConnectionResponse,
  /**
   * @param {!proto.notification.ConnectionRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.notification.ConnectionResponse.deserializeBinary
);


/**
 * @param {!proto.notification.ConnectionRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.notification.ConnectionResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.notification.ConnectionResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.notification.NotificationServiceClient.prototype.removeConnection =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/notification.NotificationService/RemoveConnection',
    request,
    metadata || {},
    methodDescriptor_NotificationService_RemoveConnection,
    callback);
};


/**
 * @param {!proto.notification.ConnectionRequest} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.notification.ConnectionResponse>}
 *     Promise that resolves to the response
 */
proto.notification.NotificationServicePromiseClient.prototype.removeConnection =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/notification.NotificationService/RemoveConnection',
    request,
    metadata || {},
    methodDescriptor_NotificationService_RemoveConnection);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.notification.SubscribeRequest,
 *   !proto.notification.Notification>}
 */
const methodDescriptor_NotificationService_StreamNotifications = new grpc.web.MethodDescriptor(
  '/notification.NotificationService/StreamNotifications',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.notification.SubscribeRequest,
  proto.notification.Notification,
  /**
   * @param {!proto.notification.SubscribeRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.notification.Notification.deserializeBinary
);


/**
 * @param {!proto.notification.SubscribeRequest} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.notification.Notification>}
 *     The XHR Node Readable Stream
 */
proto.notification.NotificationServiceClient.prototype.streamNotifications =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/notification.NotificationService/StreamNotifications',
    request,
    metadata || {},
    methodDescriptor_NotificationService_StreamNotifications);
};


/**
 * @param {!proto.notification.SubscribeRequest} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.notification.Notification>}
 *     The XHR Node Readable Stream
 */
proto.notification.NotificationServicePromiseClient.prototype.streamNotifications =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/notification.NotificationService/StreamNotifications',
    request,
    metadata || {},
    methodDescriptor_NotificationService_StreamNotifications);
};


// module.exports = proto.notification; // CommonJS - disabled for ES6

// ES6 module exports for Vite/modern bundlers
export const NotificationServiceClient = proto.notification.NotificationServiceClient;
export const NotificationServicePromiseClient = proto.notification.NotificationServicePromiseClient;
