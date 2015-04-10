
/**
 * Module dependencies.
 */

var crypto = require('crypto');
var extend = require('extend');

/**
 * Map `identify`.
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

exports.identify = function(identify){
  var traits = prefixKeys(identify.traits(), 'cv_');
  delete traits.cv_id;
  return extend(traits, {
    id: identify.userId(),
    cv_company: identify.proxy('traits.company'),
    timestamp: identify.timestamp().getTime(),
    timeout: timeout(identify, this.settings),
    cookie: cookie(identify),
    cv_name: identify.name(),
    lang: language(identify),
    ua: identify.userAgent(),
    host: this.settings.domain,
    ip: identify.ip()
  });
};

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var props = prefixKeys(stringifyNested(track.properties()), 'ce_');
  delete props.ce_id;
  return extend(props, {
    id: track.userId(),
    timestamp: track.timestamp().getTime(),
    timeout: timeout(track, this.settings),
    ce_name: track.event(),
    host: this.settings.domain,
    cookie: cookie(track),
    lang: language(track),
    ua: track.userAgent(),
    ip: track.ip()
  });
};

/**
 * Create a cookie.
 *
 * @param {Facade} message
 * @return {String}
 * @api private
 */

function cookie(message){
  return crypto
    .createHash('md5')
    .update(message.userId() || message.sessionId())
    .digest('hex');
}

/**
 * Get timeout.
 *
 * @param {Facade} message
 * @param {Obejct} settings
 * @return {Number}
 * @api private
 */

function timeout(message, settings){
  return message.proxy('options.timeout')
    || settings.timeout
    || 30;
}

/**
 * Language.
 *
 * @param {Facade} message
 * @return {String}
 * @api private
 */

function language(message){
  return message.proxy('traits.language')
    || message.proxy('options.language');
}

/**
 * Prefix keys of `obj` with `str`.
 *
 * @param {Object} obj
 * @param {String} str
 * @return {Object}
 * @api private
 */

function prefixKeys(obj, str){
  return Object.keys(obj).reduce(function(ret, key){
    ret[str + key] = obj[key];
    return ret;
  }, {});
}

/**
 * Stringify nested objects.
 *
 * Undocumented aspect of Woopra's API, but apparently required. Breaks
 * on `Completed Order` `properties.products`.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function stringifyNested(obj){
  return Object.keys(obj).reduce(function(ret, key){
    if (typeof obj[key] === 'object') ret[key] = JSON.stringify(obj[key]);
    else ret[key] = obj[key];
    return ret;
  }, {});
}
