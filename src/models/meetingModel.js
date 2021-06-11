module.exports.MEETING = {

  CREATE: {
    type: 'required|integer',
    topic: 'required|string',
    settings: 'required',
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
