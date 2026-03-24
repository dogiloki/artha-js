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
        this.addEventListener('property-changed',()=>{
            this.render();
        });
        this.render();
    }

    getLoaderInstance(){
        return new (this.type)(this.getAttribute("type"),this.text);
    }

    render(){
        this.innerHTML="";
        const content=this.getLoaderInstance().render();
        this.appendChild(content[0]);
        this.appendChild(content[1]);
    }

}