// Initialize layout, drag-and-drop, and section state
function init() {
	var cdabody = $('#cdabody');
	if (!cdabody.length) return;

	// Initialize Packery grid
	cdabody.packery({
		stamp: '.stamp',
		columnWidth: 'div.section:not(.narr_table)',
		itemSelector: 'div.section',
		gutter: 10,
		transitionDuration: '0.2s'
	});

	// Make sections draggable
	cdabody.find('div.section:not(.recordTarget)').each(function(i, gridItem) {
		var draggie = new Draggabilly(gridItem);
		cdabody.packery('bindDraggabillyEvents', draggie);
	});

	// Restore section order from localStorage
	if (typeof localStorage.firstsection !== 'undefined') {
		var firstsection = localStorage.firstsection.split(',');
		for (var i = firstsection.length - 1; i >= 0; i--) {
			if (firstsection[i]) {
				var section = $('.section[data-code="' + firstsection[i] + '"]');
				var li = $('.toc[data-code="' + section.attr('data-code') + '"]');
				if (section.length && li.length) {
					section.parent().prepend(section);
					li.parent().prepend(li);
				}
			}
		}
	}

	// Restore hidden sections from localStorage
	if (typeof localStorage.hidden !== 'undefined') {
		var hidden = localStorage.hidden.split(',');
		for (var j = 0; j < hidden.length; j++) {
			if (hidden[j]) {
				var hsection = $('.section[data-code="' + hidden[j] + '"]');
				hsection.hide();
				$('.toc[data-code="' + hidden[j] + '"]').addClass('hide');
			}
		}
	}

	// Reflow grid
	cdabody.packery('reloadItems');
	cdabody.packery();
}
var cdaxml='';
var hidden=new Array();
var firstsection=new Array();
var sectionorder=[];
var collapseall;
//localStorage.setItem("hidden", hidden);

$(document).ready(function(){
	$('.viewbtn').off('click').click(function(){
		var id_target=$(this).attr('id_target');
		$('.cdaview:not([id="'+id_target+'"])').hide()
		$('#'+id_target).show()
	})
	init()

	// Handle local file upload for CCD XML
	$('#localfileinput').on('change', function(e) {
		var file = e.target.files[0];
		if (!file) return;
		var reader = new FileReader();
		reader.onload = function(evt) {
			$('#cdaxml').val(evt.target.result);
		};
		reader.readAsText(file);
	});
	$('#ghrepos').click(function(){
		ghowner=$('#ghowner').val()
		var url='https://api.github.com/users/'+ghowner+'/repos?sort=asc';
		$.get( url, function( data ) {
			loadrepos(data)
		});
	})
	$('#ghsearch').click(function(){
		s=$('#ghowner').val()
		var url='https://api.github.com/search/repositories?q='+s+'&sort=stars&order=desc';
		$.get( url, function( data ) {
			loadrepos(data)
		});
	})

	$('#fileInput').change(function(){
        startProcessing($("#fileInput"), populateResults, populateError, populateProgress);		
	})
})
function loadrepos(xhr){
	var ojson=xhr;
	if(xhr.items!==undefined)
		ojson=xhr.items
	else
		ojson=xhr
	var s='';
	for(var i=0,j=ojson.length; i<j; i++){
		o=ojson[i]
		s=s+'<p class="pure-button loadrepo" owner="'+o.owner.login+'" path="" title="'+o['description']+'" reponame="'+o['name']+'">'+o['name']+'</p>'
	}
	$('#github').html(s);

	$('#github').find('.loadrepo').click(function(){
		var reponame=$(this).attr('reponame')
		var owner=$(this).attr('owner')
		var url='https://api.github.com/repos/'+owner+'/'+reponame+'/contents'
		$.get(url,function(data){loadcontents(data,reponame,owner,'')})	
			.fail(function(){alert('Error - failed to retrieve data.')})
	})
}
function loadcontents(data,reponame,owner,path){
	var ojson=data;
	var s='';
	if(path.indexOf('/')!=-1){
		path=path.substring(0,path.indexOf('/'))
	}
	else
		path=''
		s=s+'<p class="pure-button loadrepo" path="'+path+'" owner="'+owner+'" reponame="'+reponame+'">..<i class="fa fa-level-up" /></p>'
	for(var i=0,j=ojson.length; i<j; i++){
		o=ojson[i]
		if((o['type']=='file')&&(o['name'].indexOf('.xml')>0))
			s=s+'<p class="pure-button transform" file="'+o['download_url']+'"><i class="fa fa-angle-double-right"></i>'+o['name']+'</p>'
		else if (o['type']=='dir'){
			s=s+'<p class="pure-button loadrepo" path="'+o['path']+'" owner="'+owner+'" reponame="'+reponame+'"><i class="fa fa-folder" /> '+o['name']+'</p>'
		}
	}
	$('#github').html(s);

	$('#github').find('.loadrepo').click(function(){
		var url='https://api.github.com/repos/'+$(this).attr('owner')+'/'+$(this).attr('reponame')+'/contents/'+$(this).attr('path')
		var reponame=$(this).attr('reponame')
		var owner=$(this).attr('owner')
		var path=$(this).attr('path')
		$.get(url,function(data){loadcontents(data,reponame,owner,path)})	
			.fail(function(){alert('Error - failed to retrieve data.')})
	})
	$('#github').find('.transform').off('click').click(function(){
		$('#viewcda').html('')
		if($(this).attr('file')!=undefined){
			cdaxml=$(this).attr('file')
		}
		new Transformation().setXml(cdaxml).setXslt('cda.xsl').transform("viewcda");
	})
// ...existing code...

	$('.hideshow').click(function(){
		var up=$(this).find('i').hasClass('fa-compress')
		
		if(up){
			$('div.sectiontext').slideUp(function(){
				adjustWidth($(this).parent().parent())
			})
			$('.minimise').addClass('fa-expand').removeClass('fa-compress')
		}
		else{
			$('div.sectiontext').slideDown(function(){
				adjustWidth($(this).parent().parent())
			})			
			$('.minimise').addClass('fa-compress').removeClass('fa-expand')
		}
		$('#cdabody').packery();
		$('.hideshow').find('i').toggleClass('fa-compress fa-expand')
		//$('.minimise').toggleClass('fa-compress fa-expand')
		localStorage.setItem("collapseall", up);

	})

	$('#restore').off('click').click(function(){
		$('#viewcda').html()
		localStorage.setItem("firstsection", []);
		new Transformation().setXml(cdaxml).setXslt('cda.xsl').transform("viewcda");
		alert('Order is restored')
		init()
		//location.reload()
	})
	$('#showall').click(function(){
		localStorage.setItem("hidden", []);
		//var section=$(this).closest('div.section')
		$('.section').each(function(){
			$(this).show()
			var code=$(this).attr('data-code')
			$('.toc[data-code="'+code+'"]').removeClass('hide').find('i.tocli').addClass('fa-check-square-o').removeClass('fa-square-o')
		})
		$('#cdabody').packery()	
	})
	$('.transform').off('click').click(function(){
		$('#viewcda').html('')
		if($(this).attr('file')!=undefined){
			cdaxml=$(this).attr('file')
		}
		else{
			cdaxml=$('#cdaxml').val()
		}
		
		//jquery $('#viewcda').xslt(cdaxml, './cda.xsl');
		
		new Transformation().setXml(cdaxml).setXslt('cda.xsl').transform("viewcda");
		//$('#inputcda').hide(function(){
			//$('#viewcda').show(function(){
				//init()
				//$('#inputcdabtn').show()
			//})
		//})
	})
	$('i.delete').click(function(){
		var section=$(this).closest('div.section')
		section.fadeOut(function(){
			var code=section.attr('data-code')
			if(hidden.indexOf(code)==-1){
				hidden.push(code)
				localStorage.setItem("hidden", hidden);
			}
			cdabody.packery()	
			$('.toc[data-code="'+code+'"]').addClass('hide').find('i.tocli').removeClass('fa-check-square-o').addClass('fa-square-o')
			th=$('#tochead')
			if($('li.hide.toc[data-code]').length!=0){
				if(th.find('i.fa-warning').length==0)
					th.prepend('<i class="fa fa-warning fa-lg" style="margin-right:0.5em" title="Sections are hidden"></i>')				
			}
			else{
				th.find('i.fa-warning').remove()
			}
		})		
	})


	
	if((typeof(Storage) !== "undefined")&&(localStorage!=undefined)) {
		collapseall=localStorage.collapseall
		//alert(collapseall)
		if((collapseall==undefined)||(collapseall=='false')){
			$('div.sectiontext').show(function(){
				//adjustWidth($(this).parent().parent())
			})
			$('.hideshow').find('i').addClass('fa-compress').removeClass('fa-expand')
			$('.minimise').addClass('fa-compress').removeClass('fa-expand')
		}
		else{
			$('div.sectiontext').hide(function(){
				//alert('asdf')
				adjustWidth($(this).parent().parent())
			})			
			$('.hideshow').find('i').addClass('fa-expand').removeClass('fa-compress')

			//$('.minimise').toggleClass('fa-compress fa-expand')
		}

		if(typeof(localStorage.hidden)!='undefined'){
			hidden=localStorage.hidden.split(',')
			var ihid=0;
			for (i = 0; i <hidden.length; i++){
				if((hidden[i]!==undefined)&&(hidden[i]!="")){
					var section=$('.section[data-code="'+hidden[i]+'"]')
					section.hide()
					$('.toc[data-code="'+hidden[i]+'"]').addClass('hide').find('i.tocli').removeClass('fa-check-square-o').addClass('fa-square-o')
					ihid++
				}
			}
			if(ihid>0){
				th=$('#tochead')
				th.prepend('<i class="fa fa-warning fa-lg" style="margin-right:0.5em" title="'+ihid+' sections are hidden"></i>')

			}
			if(typeof(localStorage.firstsection)!='undefined'){
			firstsection=localStorage.firstsection.split(',')
				if(firstsection.length>1){
					for (i = firstsection.length-1; i >-1; i--){
						if((firstsection[i]!==undefined)&&(firstsection[i]!="")){
							var section=$('.section[data-code="'+firstsection[i]+'"]')
							var li=$('.toc[data-code="'+section.attr('data-code')+'"]')
							moveup(section,li,false)							
							sectionorder.splice(sectionorder.indexOf(firstsection[i]),1)
						}
					}
				}
			}
		}
		
		for (i = 0; i <sectionorder.length; i++){
			firstsection.push(sectionorder[i])
		}
		$('#cdabody').packery('reloadItems');
		$('#cdabody').packery();
		var d=new Date();
		localStorage.setItem("lastaccess", d.getDate()+" "+d.getMonth()+" "+d.getFullYear());
	} else {
		$('#storagemsg').text('Your browser does not have localStorage - your preferences will not be saved')
	}


}
function adjustWidth(section){
	s=section.attr('style')
	var is=s.indexOf('width:')
	
	if(is>-1){
		var ie=s.indexOf('px;')
		sStart=s.substring(0,is)
		sEnd=s.substring(is,s.length)
		ie=sEnd.indexOf('px;');
		sEnd=sEnd.substring(ie+3,sEnd.length)
		s=sStart+sEnd;
		section.attr('style',s)
	}
	
	if(section.find('table').length>0){
		if(section.find('table').width()>section.width())
			section.width(section.find('table').width()+20)
	}
	$('#cdabody').packery();
	
}
function moveup(section,li,bRefresh){
	var curr=li
	curr.fadeOut(function(){
		var t=li.parent().find('li:first')
		t.before(curr)
		curr.fadeIn()
	})
	
	//section
	f=section.parent().find('div.section:eq(0)')
	f.before(section)
	if(bRefresh){
		var code=section.attr('data-code');
		if(firstsection.indexOf(code)==-1){
			firstsection.unshift(code)
		}
		else{
			firstsection.splice(firstsection.indexOf(code),1)
			firstsection.unshift(code)
		}
		localStorage.setItem("firstsection", firstsection);
		$('#cdabody').packery('reloadItems');
		$('#cdabody').packery();
	}

}
function movedown(section,li,bRefresh){
	curr=li
	curr.fadeOut(function(){
		t=curr.next('[data-code]')
		t.after(curr)
		curr.fadeIn()
	})

	//f=section.parent().find('div.section:eq(1)')
	f=section.next()
	f.after(section)
	if(bRefresh){
		var code=section.attr('data-code');
		if(firstsection.indexOf(code)==-1){
			firstsection.unshift(code)
		}
		else{
			var pos=firstsection.indexOf(code)
			if(pos<firstsection.length){
				var b=firstsection[pos+1];
				firstsection[pos+1]=firstsection[pos]
				firstsection[pos]=b
			}
			localStorage.setItem("firstsection", firstsection);
		}
		$('#cdabody').packery('reloadItems');
		$('#cdabody').packery();
	}
}
function orderItems(){
	firstsection=[];
	restore=$('#restore')
	var itemElems = $('#cdabody').packery('getItemElements');
	$( itemElems ).each( function( i, itemElem ) {
		var code=$( itemElem ).attr('data-code')
		firstsection.push(code)
		li=$('.toc[data-code="'+code+'"]')
		restore.before(li)
	});	
	localStorage.setItem("firstsection", firstsection);
}

function comparer(index) {
    return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index)
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB)
    }
}
function getCellValue(row, index){ return $(row).children('td').eq(index).html() }

var xmload;
function loadtextarea(fname){
	xmload = new XMLHttpRequest();
	xmload.onreadystatechange = loaded;
	try{
		xmload.open("GET", fname,true);
	}
	catch(e){alert(e)}
	xmload.send(null);
}
var loaded = function() {
	if (xmload.readyState == 4) {
		$('#cdaxml').val(xmload.responseText)
		//$('#transform').get(0).click()
	}
}
