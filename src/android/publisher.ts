import * as  utils from "utils/utils";
import * as app from 'application';
import {ContentView} from 'ui/content-view'
import {Observable} from "data/observable";
import {TNSOTSession} from "./session";
declare var com: any, android: any;
const CameraListener = com.opentok.android.Publisher.CameraListener;
const PublisherListener = com.opentok.android.PublisherKit.PublisherListener;
const Publisher = com.opentok.android.Publisher;
const BaseVideoRenderer = com.opentok.android.BaseVideoRenderer;
const AbsoluteLayout = android.widget.AbsoluteLayout;
const RelativeLayout = android.widget.RelativeLayout;

export class TNSOTPublisher extends ContentView {
    private _android: any;
    private _publisher: any;
    public static toggleVideoEvent = "toggleVideo";
    public static toggleAudioEvent = "toggleAudio";
    public static cycleCameraEvent;
    private _events;
    _render_style: any;

    constructor() {
        super();
        this._events = new Observable();
    }

    get android() {
        return this._android;
    }

    get _nativeView() {
        return this._android;
    }

    public _createUI() {
        this._android = new android.widget.LinearLayout(this._context);
    }

    publish(session: TNSOTSession, name?: string, cameraResolution?: string, cameraFrameRate?: string) {
        const that = new WeakRef(this);
        this._publisher = new com.opentok.android.Publisher(
            utils.ad.getApplicationContext(),
             name ? name : '',
             TNSOTPublisher.getCameraResolution(cameraResolution),
            TNSOTPublisher.getCameraFrameRate(cameraFrameRate)
        );
        let pub = this._publisher.getView();
        this._android.addView(pub);
        this._publisher.getRenderer().setStyle(com.opentok.android.BaseVideoRenderer.STYLE_VIDEO_SCALE, this.render_style);
        this._publisher.setPublisherListener(new PublisherListener({
            owner: that.get(),
            onError(publisher: any, error: any) {
                if (this.owner._events) {
                    this.owner._events.notify({
                        eventName: 'didFailWithError',
                        object: new Observable({
                            publisher: publisher,
                            error: error
                        })
                    });
                }
            },
            onStreamCreated(publisher: any, stream: any) {
                if (this.owner._events) {
                    this.owner._events.notify({
                        eventName: 'streamCreated',
                        object: new Observable({
                            publisher: publisher,
                            stream: stream
                        })
                    });
                }
            },
            onStreamDestroyed(publisher: any, stream: any) {
                if (this.owner._events) {
                    this.owner._events.notify({
                        eventName: 'streamDestroyed',
                        object: new Observable({
                            publisher: publisher,
                            stream: stream
                        })
                    });
                }
            }
        }));
        this._publisher.setCameraListener(new CameraListener({
            owner: that.get(),
            onCameraChanged(publisher, newCameraId) {
                if (this.owner._events) {
                    this.owner._events.notify({
                        eventName: 'cameraChanged',
                        object: new Observable({
                            publisher: publisher,
                            cameraId: newCameraId
                        })
                    });
                }
            }, onCameraError(publisher, error) {
                if (this.owner._events) {
                    this.owner._events.notify({
                        eventName: 'cameraError',
                        object: new Observable({
                            publisher: publisher,
                            error: error
                        })
                    });
                }
            }
        }));
        session.events.on('sessionDidConnect', (result:any) => {
            try {
                let stream: any = result.object;
                session.session.publish(this._publisher);
            } catch (error) {
                console.log(error);
            }
        });

    }

    public static getCameraResolution(cameraResolution) {
        if (cameraResolution) {
            switch (cameraResolution.toString().toUpperCase()) {
                case 'LOW':
                    return com.opentok.android.Publisher.CameraCaptureResolution.LOW;
                case 'MEDIUM':
                    return com.opentok.android.Publisher.CameraCaptureResolution.MEDIUM;
                case 'HIGH':
                    return com.opentok.android.Publisher.CameraCaptureResolution.HIGH;
            }
        }
        return com.opentok.android.Publisher.CameraCaptureResolution.MEDIUM;
    }

    public static getCameraFrameRate(cameraFrameRate) {
        if (cameraFrameRate) {
            switch (Number(cameraFrameRate)) {
                case 30:
                    return com.opentok.android.Publisher.CameraCaptureFrameRate.FPS_30;
                case 15:
                    return com.opentok.android.Publisher.CameraCaptureFrameRate.FPS_15;
                case 7:
                    return com.opentok.android.Publisher.CameraCaptureFrameRate.FPS_7;
                case 1:
                    return com.opentok.android.Publisher.CameraCaptureFrameRate.FPS_1;
            }
        }
        return com.opentok.android.Publisher.CameraCaptureFrameRate.FPS_30;
    }

    get render_style() {
        return this._render_style;
    }

    set render_style(value: any) {
        switch (value) {
            case 'fit':
                this._render_style = com.opentok.android.BaseVideoRenderer.STYLE_VIDEO_FIT;
                break;
            case 'fill':
                this._render_style = com.opentok.android.BaseVideoRenderer.STYLE_VIDEO_FILL;
                break;
            case 'scale':
                this._render_style = com.opentok.android.BaseVideoRenderer.STYLE_VIDEO_SCALE;
                break;
            default:
                this._render_style = com.opentok.android.BaseVideoRenderer.STYLE_VIDEO_FIT;
                break;
        }
    }

    get publisher() {
        return this._publisher;
    }

    get events():Observable{
        return this._events;
    }
    toggleCamera() {
        this.publishVideo = !this.publishVideo;
    }

    toggleVideo() {
        this.publishVideo = !this.publishVideo;
    }

    toggleMute() {
        this.publishAudio = !this.publishAudio;
    }

    get publishVideo(): boolean {
        return this._publisher.getPublishVideo();
    }

    set publishVideo(state: boolean) {
        this._publisher.setPublishVideo(state);
    }

    get publishAudio(): boolean {
        return this._publisher.getPublishAudio();
    }

    set publishAudio(state: boolean) {
        this._publisher.setPublishAudio(state);
    }

    cycleCamera() {
        this._publisher.cycleCamera();
    }

    instance() {
        return this._publisher;
    }

    unpublish(session: TNSOTSession) {
        session.session.unpublish(this._publisher);
    }

}
