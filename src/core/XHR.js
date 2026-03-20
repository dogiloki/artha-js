import Config from './Config.js';
import Util from './Util.js';

export default class XHR{

    static request(options){
        options={...Config.get("xhr"),...options};
        const {
            method,
            url,
            uri,
            headers,
            data,
            query,
            files,
            response_type,
            with_credentials,
            timeout,
            retry,
            retry_delay,
            onLoad,
            onData,
            onError,
            onTimeout,
            onProgress,
            onAbort,
            onAction
        }=options;
        url??="/"+uri;
        const xhr=new XMLHttpRequest();
        const query_string=Object.keys(query).length?"?"+Object.entries(query)
        .map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&"):"";
        xhr.open(method,url+query_string,true);
        xhr.responseType=response_type;
        xhr.withCredentials=with_credentials;
        xhr.timeout=timeout;

        // Encabezados
        const token=Util.getMeta("csrf-token")??Util.getMeta("csrf_token");
        if(token){
            xhr.setRequestHeader("X-CSRF-Token",token);
        }
        for(let key in headers){
            xhr.setRequestHeader(key,headers[key]);
        }

        // Cuerpo
        let body=null;
        if(method!=='GET'){
            const form_data=new FormData();
            if(token) form_data.append("csrf_token",token);
            form_data.append("_method",method);
            for(let key in data){
                form_data.append(key,data[key]);
            }
            for(let key in files){
                const value=files[key];
                if(Array.isArray(value) || value instanceof FileList){
                    for(let index=0; index<value.length; index++){
                        form_data.append(`${key}[]`,value[index]);
                    }
                }else{
                    form_data.append(key,value);
                }
            }
            body=form_data;
        }

        // Carga con datos según la respuesta
        xhr.addEventListener("load",()=>{
            onLoad(xhr);
            if(Util.withinRange(xhr.status,200,299)){
                onData(xhr.response);
            }else{
                onError(xhr.response);
            }
        });

        // Error
        xhr.addEventListener("error",()=>{
            if(retry){
                setTimeout(()=>{
                    XHR.request(options);
                },retry_delay);
            }
            onError(xhr.response);
        });

        // Aborto
        xhr.addEventListener("abort",()=>{
            onAbort(xhr.response);
        });

        // Tiempo de espera
        xhr.addEventListener("timeout",()=>{
            if(retry){
                setTimeout(()=>{
                    XHR.request(options);
                },retry_delay);
            }
            onTimeout(xhr.response);
        });

        // Progreso
        xhr.addEventListener("progress",(evt)=>{
            onProgress(evt,evt.loaded,evt.total);
        });

        // Enviar
        onAction(xhr);
        xhr.send(body);
        return xhr;
    }
    
}