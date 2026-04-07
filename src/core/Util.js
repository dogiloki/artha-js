export default class Util{

    static defaults={
        locale:"es-MX",
        currency:"MXN",
        money:{
            style:"currency",
            digits:2
        }
    };

    static QUERY_ELEMENTS_INPUT='.checkbox-field,.input-field';

    static httpStatusText(code){
        let text="";
        if(Util.withinRange(code,200,299)){
            return "OK";
        }
        switch(code){
            case 404: text="Not found";
            case 403: text="Forbidden";
            case 401: text="Unauthorized";
            case 500: text="Internal Server Error";
            case 400: text="Bad Request";
            case 419: text="Page Expired";
            case 405: text="Method Not Allowed";
            case 408: text="Request Timeout";
            case 429: text="Too Many Requests";
            case 503: text="Service Unavailable";
            case 504: text="Gateway Timeout";
            default: text="Error";
        }
        return text;
    }

}