import BaseComponent from '../abstract/BaseComponent.js';
import TaskQueue from '../core/TaskQueue.js';
import LoaderDots from '../components/loaders/LoaderDots.js';
import LoaderRing from '../components/loaders/LoaderRing.js';
import LoaderImg from '../components/loaders/LoaderImg.js';

export default class ArthaLoader extends BaseComponent{

    static TYPE=Object.freeze({
        IMG:{
            name:'img',
            clazz:LoaderImg
        },
        DOTS:{
            name:'dots',
            clazz:LoaderDots
        },
        RING:{
            name:'ring',
            clazz:LoaderRing
        }
    });

    static defaults={
        type:ArthaLoader.TYPE.RING.name,
        title:TaskQueue.defaults.title,
        src:''
    }

    constructor(){
        super(
            ['type','title','src'],
            {
                defaults:{
                    type:ArthaLoader.defaults.type,
                    title:ArthaLoader.defaults.title,
                    src:ArthaLoader.defaults.src
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
                },
                reflect:{
                    src:false
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
        return new loader_class(this.getAttribute("type"),this.title,this.src);
    }

    render(){
        const content=this.getLoaderInstance().render();
        this.replaceChildren(...content);
    }

}