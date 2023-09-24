/**
 * @author js@schindler-edv.de
 * @copyright 2003 by Schindler EDV Service
 * 
 * @todo WiFi State
 */

const back = require('androidjs').back;
const upnp = require('node-upnp-utils');
const MediaRendererClient = require('upnp-mediarenderer-client');
let client = null;

/**
 * start scan, callback on every device
 */
back.on("startDeviceScan", function() {
	try {
		back.send("scan-start", "upnp device start scan now");

		upnp.startDiscovery({mx: 5});

		// Stop the discovery process in 15 seconds
		setTimeout(() => {
			upnp.stopDiscovery(() => {
				back.send("scan-stop", 'Stopped the discovery process.');
			});
		}, 15000);
	} catch(e) {
		back.send("error", "exception "+e.message)
	}
});
/**
 * return device list
 */
back.on("getDevices", function() {
	back.send('devicesList', upnp.getActiveDeviceList());
});
/**
 * select one device
 */
back.on("selectDevice", function(device) {
	if(device && device.headers) {
		back.send("debug-msg", device.headers.LOCATION);
		try {
			client = new MediaRendererClient(device.headers.LOCATION);

			if(client) {
				client.getVolume(function(err, volume) {
					if(err) throw err;
					back.send("device-connected", device.description.device.friendlyName);
					back.send("getVolume", volume);
				});
			} else {
				back.send("error", "no device selected");
			}
		} catch (e)	{
			back.send("error", "selectDevice exception "+e.message);
		}
	} else {
		back.send("error", "no device");
	}
});
back.on("setVolume", function(volume) {
	back.send("debug-msg", "setVolume: "+volume)
	if (client) {
        client.setVolume(volume, function(err) {
            if(err) throw err;
        });
	} else {
		back.send("error", "no device selected");
	}
});
back.on("getVolume", function() {
	if (client) {
		client.getVolume(function(err, volume) {
			if(err) throw err;
			back.send("getVolume", volume);
		});
	} else {
		back.send("error", "no device selected");
	}
});

upnp.on('deleted', (device) => {
});

upnp.on('added', (device) => {
	back.send("device-found", device);
});