window.ES= (function(_d){
     
     /*
     1
     00:00:20,000 --> 00:00:24,400
     Altocumulus clouds occur between six thousand
     **/


    /***********/
    
    var subList= [],
        subListIterator= 0,
        _tpl= false;
    
     var Sub= function(){
         
         this.startTime= {
                hours: '00',
                minutes: '00',
                seconds: '00',
                hundredth: '000'
             };
         this.stopTime= {
                hours: '00',
                minutes: '00',
                seconds: '00',
                hundredth: '000'
            },
         this.output= "";
         this.strFormat= "";
         this.lineNum= 1;
         var _self= this;
         
         this.setStartTime= function(hours, minutes, seconds, hundredth){
             this.startTime.hours= hours;
             this.startTime.minutes= minutes;
             this.startTime.seconds= seconds;
             this.startTime.hundredth= hundredth;
             _setSTR();
         };
         this.setStopTime= function(hours, minutes, seconds, hundredth){
             this.stopTime.hours= hours;
             this.stopTime.minutes= minutes;
             this.stopTime.seconds= seconds;
             this.stopTime.hundredth= hundredth;
             _setSTR();
         };
         
         this.setOutput= function(str){
             this.output= str;
             _setSTR();
             //console.log(_output)
         }
         
         this.setLineNumber= function(n){
             this.lineNum= n;
         }
         
         this.parse= function(str){
             
             var peaces= str.split(/\n/g),
                 idx= parseInt(peaces.shift(), 10),
                 times= peaces.shift().replace(/\.|\:|( \-\-\> )/g, ',').split(',');
             this.setLineNumber(idx);
             this.setStartTime(times[0], times[1], times[2], times[3]);
             this.setStopTime(times[4], times[5], times[6], times[7]);
             this.setOutput(peaces.join("\n"));
             _setSTR();
         }
         
         var _setSTR= function(){
             
             var startTime= _self.startTime,
                 stopTime= _self.stopTime;
             
             this.strFormat= this.lineNum+"\n"+startTime.hours+':'+startTime.minutes+':'+startTime.seconds+','+startTime.hundredth+
                         ' --> '+
                         stopTime.hours+':'+stopTime.minutes+':'+stopTime.seconds+','+stopTime.hundredth+'\n'+
                         this.output+"\n\n";
             return this.strFormat;
         }
         
         this.asSTR= function(){
             return this.strFormat;
         }
         
         /*var pObject= {
             setStartTime: _setStartTime,
             setStopTime: _setStopTime,
             setOutput: _setOutput,
             asSTR: _asSTR,
             toString: _asSTR,
             startTime: startTime,
             stopTime: stopTime,
             output: _output,
             parse: _parse
         }*/
         
         //this.output;
         
         
         return this;
     };
     
     var _subFactory= {
                add: function(str){
                        var nSub= new Sub();
                        subList[subListIterator]= nSub;
                        subListIterator++;
                        
                        if(str)
                            nSub.parse(str);
                        
                        if(nSub.lineNum)
                            stCount= nSub.lineNum;
                        else
                            stCount++;
                        
                        return nSub;
                    },
                remove: function(idx){
                    return subList.splice(idx, 1);
                },
                asSTR: function(){
                    var i= 0,
                        l= subList.length,
                        ret= "";
                      
                    for(; i<l; i++){
                        ret+= subList[i].asSTR();
                    }
                    return ret;
                }
        }
         
     /***********/  


    var v= _d.getElementById('video'),
        sContainer= _d.getElementById('subtitles-container'),
        playing= false,
        stCount= 1,
        speakingStartTime= 0,
        speakingStopTime= 0;


    var _formatTime= function(s){
        var str= "",
            h= 0, m= 0,
            tmp;

        while(s>60){
            s= s-60;
            m++
        }
        while(m>60){
            m= m-60;
            h++;
        }
        s= s.toFixed(3).toString().replace('.', ',');

        str= (h<10? '0'+h: h)+':'+(m<10? '0'+m: m)+':'+s;
        return str;
    };

    var _startVideo= function(){
        if(playing){
            speakingStartTime= 0;
            playing= false;
            v.pause();
        }else{
            playing= true;
            v.play();
        }
    };

    var _speakingStart= function(){
        speakingStartTime= v.currentTime - .250;
    };

    var _selectSub= function(el){
        el= el[0]? el: $(el);
        
        _unselect();
        el.addClass('selected');
    }
    
    var _unselect= function(){
        $('.selected').removeClass('selected');
    };

    var _speakingStop= function(){

        var str= "",
            subtitle= "",
            sub= null,
            el= null;
        
        speakingStopTime= v.currentTime;
        v.pause();
        v.currentTime= speakingStartTime;
        subtitle= "";
        
        str= stCount+"\n"+_formatTime(speakingStartTime)+ ' --> '+ _formatTime(speakingStopTime)+"\n"+subtitle+"\n\n";
        sub= _subFactory.add(str);
        sub.setLineNumber(stCount);
        stCount++;
        
        _addSubsElements(sub);
        el= $('.subtitle').eq(sub.lineNum-1);
        
        _selectSub(el);
        el.find('textarea').focus();
        
        return;
    };
    
    var _selectVideo= function(){
        v.src= this.value;
    }
    
    var _srtToObjectList= function(srt){
        var subs= srt.replace(/\n\r/g, '\n')
                     .replace(/\r\n/g, '\n')
                     .replace(/\r/g, '\n')
                     .split(/\n\n/g),
            i= 0, l= subs.length;
        
        for(; i<l; i++){
            _subFactory.add(subs[i]);
        }
    };
    
    var _buildSubsElements= function(){
        _tpl= _tpl||$('#tpl-subtitle').text();
        $('#subtitles-container').html(Mustache.render(_tpl, {list:subList}));
    };
    
    var _addSubsElements= function(sub){
        var _list= typeof sub == 'object' && sub.length? sub: [sub],
            sib= $('.subtitle').eq(sub.lineNum-1),
            method= 'after';
        
        _tpl= _tpl||$('#tpl-subtitle').text();
        if(!sib[0]){
            sib= $('#subtitles-container');
            method= 'append';
        }
        sib[method](Mustache.render(_tpl, {list:_list}));
        //_d.getElementById('subtitles-container').innerHTML+= Mustache.render(_tpl, {list:_list});
        
    };
    
    var _importSRT= function(){
        
        var file= _d.getElementById('srt-src').files,
            reader = new FileReader();
        
        if(file.length){
            file= file[0];
        }else{
            return;
        }
        
        reader.onload = (function(theFile) {
            return function(e) {
              _srtToObjectList(reader.result);
              $('#srt-src').parent().hide();
              _buildSubsElements();
            };
        })(file);

        var blob = file.slice(0, file.size-1);
        reader.readAsBinaryString(blob);
    };
    
    var _bindEvents= function(){
        $('#video-src').change(_selectVideo);
        
        if (window.File && window.FileReader){
            $('#imporSRT').click(_importSRT);
        }else{
            $('#str-src').parent().hide();
        }
        
        $(v).bind('playing', function(){
            playing= true;
        });
        $(v).bind('pause', function(){
            playing= false;
        });
    };
    
    var _init= function(){
        _bindEvents();
    };
    
    return {
        startVideo: _startVideo,
        speakingStart: _speakingStart,
        speakingStop: _speakingStop,
        init: _init
    }
})(document, $);

$(document).ready(function(){
    ES.init();
})