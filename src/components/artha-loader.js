import BaseComponent from '../abstract/BaseComponent.js';
import TaskQueue from '../core/TaskQueue.js';
import LoaderDots from '../components/loaders/LoaderDots.js';
import LoaderRing from '../components/loaders/LoaderRing.js';

export default class ArthaLoader extends BaseComponent{

    static TYPE=Object.freeze({
        DOTS:{
            name:'dots',
            clazz:LoaderDots
        },
        RING:{
            name:'ring',
            clazz:LoaderRing
        },
        BAR:{
            name:'bar',
            clazz:LoaderDots
        },
        WAVE:{
            name:'wave',
            clazz:LoaderDots
        }
    });

    constructor(){
        super(
            ['type','text'],
            {
                defaults:{
                    type:ArthaLoader.TYPE.RING.name,
                    text:TaskQueue.defaults.title
                },
                resolvers:{
                    type:{
                        get:(value)=>{
                            return Object.values(ArthaLoader.TYPE).find((item)=>{
                                return item.name==value;
                            })?.clazz;
                        },
                        set:(value)=>{
                            return Object.values(ArthaLoader.TYPE).find((item)=>{
                                return item.clazz==value;
                            })?.name||value;
                        }
                    }
                }
            }
        );
        this._initialized=false;
        this._property_changed=()=>{
            this.render();
        };
    }

    onConnected(){
        if(this._initialized) return;
        this.addEventListener('property-changed',this._property_changed);
        try{
            this.render();
            this._initialized=true;
        }catch(err){
            this.removeEventListener('property-changed',this._property_changed);
            throw err;
        }
    }

    onDisconnected(){
        this.removeEventListener('property-changed',this._property_changed);
        this._initialized=false;
    }

    getLoaderInstance(){
        const loader_class=this.type;
        return new loader_class(this.getAttribute("type"),this.text);
    }

    render(){
        const content=this.getLoaderInstance().render();
        this.replaceChildren(...content);
    }

}