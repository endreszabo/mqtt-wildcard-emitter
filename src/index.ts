import mqttlib from 'mqtt';
import EventEmitter from 'eventemitter';
interface ListenerFn {
    (...args: any[]): boolean;
}

function mqttWildcard(topic: string, wildcard: string | symbol) {
    if (topic === wildcard) {
        return [];
    } else if (wildcard === '#') {
        return [topic];
    }

    var res = [];

    var t = String(topic).split('/');
    var w = String(wildcard).split('/');

    var i = 0;
    for (var lt = t.length; i < lt; i++) {
        if (w[i] === '+') {
            res.push(t[i]);
        } else if (w[i] === '#') {
            res.push(t.slice(i).join('/'));
            return res;
        } else if (w[i] !== t[i]) {
            return null;
        }
    }

    if (w[i] === '#') {
        i += 1;
    }

    return (i === w.length) ? res : null;
}

export class MqttTopicEmitter extends EventEmitter {
    public mqttclient: mqttlib.MqttClient | undefined
    constructor() {
        super()
        this.mqttclient = undefined
    }

    connect(brokerUrl: string, opts: mqttlib.IClientOptions) {
        this.mqttclient = mqttlib.connect.apply(this, [brokerUrl, opts]);
        this.mqttclient.on('message', (topic: string, message: string) => {
            this.eventNames().forEach(topicMask => {
            if (mqttWildcard(topic, topicMask))
                this.emit(topicMask, topic, message.toString(), topicMask);
            });
        });
    }
    on(event: string | symbol, fn: ListenerFn, context?: any, priority?: number | undefined): this {
        this.mqttclient!.subscribe(event.toString())
        return super.on(event, fn, context, priority)
    }
}
