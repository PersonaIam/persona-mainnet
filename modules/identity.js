'use strict';

var _ = require('lodash');
var async = require('async');
var BlockReward = require('../logic/blockReward.js');
var ByteBuffer = require('bytebuffer');
var constants = require('../helpers/constants.js');
var crypto = require('crypto');
var Inserts = require('../helpers/inserts.js');
var ip = require('ip');
var OrderBy = require('../helpers/orderBy.js');
var Router = require('../helpers/router.js');
var schema = require('../schema/blocks.js');
var slots = require('../helpers/slots.js');
var sql = require('../sql/blocks.js');
var Register = require('../logic/register.js');
var Verify = require('../logic/verify.js');
var transactionTypes = require('../helpers/transactionTypes.js');

// Private fields
var modules, library, self, __private = {}, shared = {};

__private.assetTypes = {};

function Identity(cb, scope) {
    library = scope;
    self = this;

    // register identity
    __private.assetTypes[transactionTypes.REGISTER] = library.logic.transaction.attachAssetType(
        transactionTypes.REGISTER, new Register()
    );

    // verify identity
    __private.assetTypes[transactionTypes.VERIFY] = library.logic.transaction.attachAssetType(
        transactionTypes.VERIFY, new Verify()
    );

    return cb(null, self);
}

__private.attachApi = function () {
	var router = new Router();

	router.use(function (req, res, next) {
		if (modules) { return next(); }
		res.status(500).send({success: false, error: 'Blockchain is loading'});
    });

    // router.map(shared, {
    //     'get /get': 'getID'
    // });

    library.network.app.use('/api/identity', router);
	library.network.app.use(function (err, req, res, next) {
		if (!err) { return next(); }
		library.logger.error('API error ' + req.url, err);
		res.status(500).send({success: false, error: 'API error: ' + err.message});
	});
}

Identity.prototype.onAttachPublicApi = function () {
    __private.attachApi();
}

// Events
//
//__EVENT__ `onBind`

//
Identity.prototype.onBind = function (scope) {
	modules = scope;

	__private.assetTypes[transactionTypes.REGISTER].bind({
		modules: modules, library: library
	});

	__private.assetTypes[transactionTypes.VERIFY].bind({
		modules: modules, library: library
	});
};



// shared.getID = function (req, cb) {
// }

// Export
module.exports = Identity;
