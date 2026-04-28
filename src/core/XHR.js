import DOMHelper from "../helpers/DOMHelper.js";
import NumberHelper from "../helpers/NumberHelper.js";

export default class XHR{

    static defaults={
        method:"GET",
        url:null,
        uri:"",
        headers:{},
        data:{},
        query:{},
        files:{},
        response_type:"json",
        with_credentials:false,
        timeout:0,
        retry:false,
        retry_delay:5000,
        transformResponse:(xhr)=>{
            return xhr.response;
        },
        onLoad:()=>{},
        onData:()=>{},
        onError:()=>{},
        onTimeout:()=>{},
        onProgress:()=>{},
        onAbort:()=>{},
        onAction:()=>{},
    };

    static request(options){
        options={...this.defaults,...options};
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
            transformResponse,
            onLoad,
            onData,
            onError,
            onTimeout,
            onProgress,
            onAbort,
            onAction
        }=options;
        const safeTransform=(xhr)=>{
            try{
                return transformResponse(xhr);
            }catch(ex){
                console.error("transformResponse error:",ex);
                return xhr.response;
            }
        };
        const xhr=new XMLHttpRequest();
        const query_string=Object.keys(query).length?"?"+Object.entries(query)
        .filter(([_,v])=>v!=null)
        .map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&"):"";
        xhr.open(method,url+uri+query_string,true);
        xhr.responseType=response_type;
        xhr.withCredentials=with_credentials;
        xhr.timeout=timeout;

        // Encabezados
        const token=DOMHelper.getMeta("csrf-token")??DOMHelper.getMeta("csrf_token")??DOMHelper.getMeta("_token");
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
            if(token) form_data.append("_token",token);
            if(!data['_method']) form_data.append("_method",method);
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
            onData(xhr,safeTransform(xhr));
        });

        // Error
        xhr.addEventListener("error",()=>{
            const retry_options={...options};
            if(retry){
                setTimeout(()=>{
                    XHR.request(retry_options);
                },retry_delay);
            }
            onError(safeTransform(xhr));
        });

        // Aborto
        xhr.addEventListener("abort",()=>{
            onAbort(safeTransform(xhr));
        });

        // Tiempo de espera
        xhr.addEventListener("timeout",()=>{
            const retry_options={...options};
            if(retry){
                setTimeout(()=>{
                    XHR.request(retry_options);
                },retry_delay);
            }
            onTimeout(safeTransform(xhr));
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