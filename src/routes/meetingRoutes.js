/**
 * file: content-route.js
 * author: Anuj Gupta
 * desc: route file for content
 */

var meetingService = require('../service/meetingService')
var requestMiddleware = require('../middlewares/request.middleware')
// var filterMiddleware = require('../middlewares/filter.middleware')
var healthService = require('../service/healthCheckService')

var BASE_URL = '/v1/meetings'
var dependentServiceHealth = ['EKSTEP']

module.exports = function (app) {
  app.route(BASE_URL)
    .post(healthService.checkDependantServiceHealth(dependentServiceHealth),
      requestMiddleware.gzipCompression(),
      requestMiddleware.validateToken,
      requestMiddleware.createAndValidateRequestBody, meetingService.createMeetingAPI)

  app.route(BASE_URL + '/signature')
    .post(healthService.checkDependantServiceHealth(dependentServiceHealth),
      requestMiddleware.createAndValidateRequestBody, requestMiddleware.validateToken,
      requestMiddleware.gzipCompression(), meetingService.generateSignatureAPI)

  app.route(BASE_URL + '/:meetingId')
    .get(healthService.checkDependantServiceHealth(dependentServiceHealth),
      requestMiddleware.validateToken,
      requestMiddleware.createAndValidateRequestBody, meetingService.getMeetingAPI)
}
