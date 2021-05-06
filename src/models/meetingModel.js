module.exports.MEETING = {

  CREATE: {
    type: 'required|int',
    topic: 'required|string',
    settings: 'required|object',
    created_by: 'required|string'
  },

  GET: {
    meetingId: 'required|string'
  },

  GENERATE_SIGNATURE: {
    meetingId: 'required|string',
    role: 'required|int'
  }

}
