export function getValueByPath(obj,path,default_value=null){
    return path.split(".").reduce((o,p)=>o?o[p]:default_value,obj);
}

export function formDataToArray(form_data){
    let data={};
    form_data.forEach((value,key)=>{
        data[key]=value;
    });
    return data;
}

export function arrayRemove(array,item_remove){
    if(Array.isArray(array)){
        return array.filter(item=>item!==item_remove);
    }else
    if(typeof array==='object'){
        let array_filter={};
        for(let key in array){
            if(array.hasOwnProperty(key) && array[key]!==item_remove){
                array_filter[key]=array[key];
            }
        }
        array=array_filter;
        return array;
    }
    return array;
}
export function iterate(count,action,params=[]){
    let elements=[];
    for(let index=0; index<count; index++){
        elements.push(action(index,...params));
    }
    return elements;
}

export default class DataHelper{
    
    static getValueByPath=getValueByPath;
    static formDataToArray=formDataToArray
    static arrayRemove=arrayRemove;
    static iterate=iterate;

}