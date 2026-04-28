// Helpers
import DataHelper from './helpers/DataHelper.js';
import DOMHelper from './helpers/DOMHelper.js';
import FormatHelper from './helpers/FormatHelper.js';
import FormHelper from './helpers/FormHelper.js';
import NumberHelper from './helpers/NumberHelper.js';
import StringHelper from './helpers/StringHelper.js';

// Components
import EventBus from './core/EventBus.js';
import TaskQueue from './core/TaskQueue.js';
import XHR from './core/XHR.js';
import SPA from './core/SPA.js';

// Core
import ArthaMessage from './components/artha-message.js';
import ArthaLoader from './components/artha-loader.js';
import ArthaContainer from './components/artha-container.js';
import ArthaForm from './components/artha-form.js';
import ArthaField from './components/artha-field.js';
import ArthaSelect from './components/artha-select.js';
import InputSearch from './components/input-search.js';

export {
    DataHelper,
    DOMHelper,
    FormatHelper,
    FormHelper,
    NumberHelper,
    StringHelper,
    EventBus,
    TaskQueue,
    XHR,
    SPA,
    ArthaMessage,
    ArthaLoader,
    ArthaContainer,
    ArthaForm,
    ArthaField,
    ArthaSelect,
    InputSearch
};

Promise.resolve().then(()=>{
    EventBus.emit('artha:before-register',{});
    registerComponents();
    EventBus.emit('artha:after-register',{});
});

function registerComponents(){
    if(!customElements.get('artha-container')){
        customElements.define('artha-container',ArthaContainer);
    }
    if(!customElements.get('artha-form')){
        customElements.define('artha-form',ArthaForm);
    }
    if(!customElements.get('artha-message')){
        customElements.define('artha-message',ArthaMessage);
    }
    if(!customElements.get('artha-loader')){
        customElements.define('artha-loader',ArthaLoader);
    }
    if(!customElements.get('input-search')){
        customElements.define('input-search',InputSearch);
    }
    if(!customElements.get('artha-field')){
        customElements.define('artha-field',ArthaField);
    }
    if(!customElements.get('artha-select')){
        customElements.define('artha-select',ArthaSelect);
    }
}