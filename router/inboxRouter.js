// external imports
const express = require("express");

//internal import
const { getConversationLists, addConversation, getMessages, sendMessage } = require("../controller/inboxControllers");
const { checkLogin } = require("../middleware/common/checkLogin");
const decorateHtmlRes = require("../middleware/common/decorateHtmlRes");
const attachmentUpload = require("../middleware/inbox/attachmentUpload");

const router = express.Router();

// get conversations
router.get("/getConversationLists", decorateHtmlRes("Inbox"), checkLogin, getConversationLists);

// add conversation
router.post("/addConversation", checkLogin, addConversation);

// get messages of a conversation
router.get("/messages/:conversationId", checkLogin, getMessages);

// send message
router.post("/sendMessage", checkLogin, attachmentUpload, sendMessage);

module.exports = router;
