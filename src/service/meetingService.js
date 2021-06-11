/**
 * @name : contentService.js
 * @description :: Responsible for handle content service
 * @author      :: Anuj Gupta
 */

var async = require('async')
var contentProvider = require('sb_content_provider_util')
var respUtil = require('response_util')
var logger = require('sb_logger_util_v2')
var validatorUtil = require('sb_req_validator_util')

var meetingModel = require('../models/meetingModel').MEETING
var messageUtils = require('./messageUtil')
var utilsService = require('../service/utilsService')

var meetingMessage = messageUtils.MEETING
var responseCode = messageUtils.RESPONSE_CODE

/**
 * This function helps to create meeting
 * @param {type} req
 * @param {type} response
 * @returns {object} return response object with http status
 */
function createMeetingAPI (req, response) {
  var data = req.body
  var rspObj = req.rspObj

  if (!data.request || !validatorUtil.validate(data.request, meetingModel.CREATE)) {
    // prepare
    rspObj.errCode = meetingMessage.CREATE.MISSING_CODE
    rspObj.errMsg = meetingMessage.CREATE.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR

    logger.error({
      msg: 'Error due to missing request || request body',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: { data }
    }, req)
    return response.status(400).send(respUtil.errorResponse(rspObj))
  }

  // Transform request for Ek step
  // data.request.content.code = getCode()
  var ekStepReqData = {
    request: data.request
  }

  async.waterfall([

    function (CBW) {
      logger.debug({
        msg: 'Request to content provider to create meeting',
        additionalInfo: { body: ekStepReqData }
      }, req)
      contentProvider.createMeeting(ekStepReqData, req.headers, function (err, res) {
        if (err || res.responseCode !== responseCode.CREATED) {
          rspObj.errCode = res && res.params ? res.params.err : meetingMessage.CREATE.FAILED_CODE
          rspObj.errMsg = res && res.params ? res.params.errmsg : meetingMessage.CREATE.FAILED_MESSAGE
          rspObj.responseCode = res && res.responseCode ? res.responseCode : responseCode.SERVER_ERROR
          logger.error({
            msg: 'Getting error from content provider while creating meeting',
            err: {
              err,
              errCode: rspObj.errCode,
              errMsg: rspObj.errMsg,
              responseCode: rspObj.responseCode
            },
            additionalInfo: { ekStepReqData }
          }, req)
          var httpStatus = res && res.statusCode >= 100 && res.statusCode < 600 ? res.statusCode : 500
          rspObj.result = res && res.result ? res.result : {}
          rspObj = utilsService.getErrorResponse(rspObj, res)
          return response.status(httpStatus).send(respUtil.errorResponse(rspObj))
        } else {
          CBW(null, res)
        }
      })
    },
    function (res) {
      // rspObj.result.content_id = res.result.node_id
      // rspObj.result.versionKey = res.result.versionKey
      rspObj.result = res && res.result ? res.result : {}
      logger.debug({ msg: 'Sending response back to user', res: rspObj.result }, req)
      return response.status(res.statusCode).send(respUtil.successResponse(rspObj))
    }

  ])
}

/**
 * This function helps to generate signature for joining meeting
 * @param {type} req
 * @param {type} response
 * @returns {object} return response object with http status
 */
function generateSignatureAPI (req, response) {
  logger.debug({ msg: 'Request for generate signature came' }, req)
  var data = req.body
  var rspObj = req.rspObj

  if (!data.request || !validatorUtil.validate(data.request, meetingModel.GENERATE_SIGNATURE)) {
    // prepare
    rspObj.errCode = meetingMessage.CREATE.MISSING_CODE
    rspObj.errMsg = meetingMessage.CREATE.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR

    logger.error({
      msg: 'Error due to missing request || request body',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: { data }
    }, req)
    return response.status(400).send(respUtil.errorResponse(rspObj))
  }

  var ekStepReqData = {
    request: data.request
  }
  async.waterfall([

    function (CBW) {
      logger.debug({
        msg: 'Request to content provider to generate signature of meeting',
        additionalInfo: {
          req: ekStepReqData,
          meetingId: data.request.meetingId
        }
      }, req)
      contentProvider.generateSignature(ekStepReqData, req.headers, function (err, res) {
        // After check response, we perform other operation
        if (err || res.responseCode !== responseCode.SUCCESS) {
          rspObj.errCode = res && res.params ? res.params.err : meetingMessage.REVIEW.FAILED_CODE
          rspObj.errMsg = res && res.params ? res.params.errmsg : meetingMessage.REVIEW.FAILED_MESSAGE
          rspObj.responseCode = res && res.responseCode ? res.responseCode : responseCode.SERVER_ERROR
          logger.error({
            msg: 'Getting error from content provider while generating signature of meeting',
            err: {
              err,
              errCode: rspObj.errCode,
              errMsg: rspObj.errMsg,
              responseCode: rspObj.responseCode
            },
            additionalInfo: { meetingId: data.request.meetingId, ekStepReqData }
          }, req)
          var httpStatus = res && res.statusCode >= 100 && res.statusCode < 600 ? res.statusCode : 500
          rspObj.result = res && res.result ? res.result : {}
          rspObj = utilsService.getErrorResponse(rspObj, res)
          return response.status(httpStatus).send(respUtil.errorResponse(rspObj))
        } else {
          CBW(null, res)
        }
      })
    },
    function (res) {
      logger.debug({ msg: 'Sending response back to user', res: rspObj }, req)
      return response.status(200).send(respUtil.successResponse(rspObj))
    }
  ])
}

/**
 * This function helps to get meeting details
 * @param {type} req
 * @param {type} response
 * @returns {object} return response object with http status
 */
function getMeetingAPI (req, response) {
  var data = {}
  data.body = req.body
  data.meetingId = req.params.meetingId
  data.queryParams = req.query
  var rspObj = req.rspObj

  logger.debug({
    msg: 'meetingService.getMeetingAPI() called', additionalInfo: { rspObj }
  }, req)

  // Adding objectData in telemetry
  if (rspObj.telemetryData) {
    rspObj.telemetryData.object = utilsService.getObjectData(data.meetingId, 'meetingId', '', {})
  }

  if (!data.meetingId) {
    rspObj.errCode = meetingMessage.GET.MISSING_CODE
    rspObj.errMsg = meetingMessage.GET.MISSING_MESSAGE
    rspObj.responseCode = responseCode.CLIENT_ERROR
    logger.error({
      msg: 'Error due to required meeting id is missing',
      err: {
        errCode: rspObj.errCode,
        errMsg: rspObj.errMsg,
        responseCode: rspObj.responseCode
      },
      additionalInfo: {
        data
      }
    }, req)
    return response.status(400).send(respUtil.errorResponse(rspObj))
  }

  async.waterfall([

    function (CBW) {
      logger.debug({
        msg: 'Request to content provider to get the meeting meta data',
        additionalInfo: {
          meetingId: data.meetingId,
          qs: data.queryParams
        }
      }, req)
      contentProvider.getMeeting(data.meetingId, req.headers, function (err, res) {
        // After check response, we perform other operation
        if (err || res.responseCode !== responseCode.SUCCESS) {
          rspObj.errCode = res && res.params ? res.params.err : meetingMessage.GET.FAILED_CODE
          rspObj.errMsg = res && res.params ? res.params.errmsg : meetingMessage.GET.FAILED_MESSAGE
          rspObj.responseCode = res && res.responseCode ? res.responseCode : responseCode.SERVER_ERROR
          logger.error({
            msg: 'Getting error from content provider while getting content using jquery',
            err: {
              err,
              errCode: rspObj.errCode,
              errMsg: rspObj.errMsg,
              responseCode: rspObj.responseCode
            },
            additionalInfo: { meetingId: data.meetingId, queryParams: data.queryParams }
          }, req)
          var httpStatus = res && res.statusCode >= 100 && res.statusCode < 600 ? res.statusCode : 500
          rspObj.result = res && res.result ? res.result : {}
          rspObj = utilsService.getErrorResponse(rspObj, res)
          return response.status(httpStatus).send(respUtil.errorResponse(rspObj))
        } else {
          CBW(null, res)
        }
      })
    },
    function (res) {
      rspObj.result = res.result
      logger.debug({ msg: 'Sending response back to user', res: rspObj }, req)
      return response.status(200).send(respUtil.successResponse(rspObj))
    }
  ])
}

module.exports.createMeetingAPI = createMeetingAPI
module.exports.getMeetingAPI = getMeetingAPI
module.exports.generateSignatureAPI = generateSignatureAPI
