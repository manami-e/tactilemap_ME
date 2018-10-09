/******************************************************
//undo機能 操作した処理を戻す関数
******************************************************/
function undo(e) { //操作を１つ戻る関数
  if(cash_array.length > 0){  //cash_arrayにデータがある場合
    var current_mode =  $('input[name="Stamp"]:checked'); //現在のモードを記憶
    //現在のviewBox情報を取得
    var vx = draw.viewbox().x , vy = draw.viewbox().y;
    var vwidth = draw.viewbox().width , vheight = draw.viewbox().height;

     //draw_areaの削除と新規作成
    $('#draw_area').remove();
    var draw_area = $('<div id="draw_area"></div>');
    $("#draw_include").append(draw_area);

    draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area');
    draw.viewbox(vx, vy, vwidth, vheight);
    draw.svg(cash_array[0]);

    draw_gridline(3000,3000,50,50); //グリッド線の描画
    defs_set();
    cash_array.shift();

    $(current_mode).prop('checked', true).trigger('change'); //モードを設定
    checkBox_change();
    js_sleep(100); //100ms待機
  }else{ //cash_arrayにデータがない場合
    alert("もう戻れません")
  }
}


function cash_svg(){ //SVG文字列を配列に格納 undo時に随時読み込む
  var current_svg= "";
  SVG.get('svg_draw_area').each(function(i, children){
    //gridline_group以外のデータをすべて文字列として結合
    //gridline_groupは行数が多すぎ、データが肥大化するため、undo機能実行時に追加する
    if(this.attr('id') !== 'gridline_group') current_svg +=this.svg();
  })
  cash_array.unshift(current_svg); //配列として記憶する
  if(cash_array.length>CASH_MAX)cash_array.pop();  //CASH_MAX以上のデータは生成しない
}

/******************************************************
//ダウンロード時に出力svgファイルをフォーマットする関数
//返却値はsvg形式のテキストデータ
******************************************************/
function download_setSVG(original_draw) { //ダウンロード時に出力svgファイルをフォーマットする関数

  dummy_delete();
  edit_image(false);
  edit_clear();
  //toConnected();
  select_rect_delete(); //select_rectの全削除
  //circle_delete(); //edit_circleの全削除
  //不要なグループの削除
  SVG.get('gridline_group').remove();
  SVG.get('handle_group').remove();
  SVG.get('guiderect_group').remove();

  draw.select('.SVG_Element').each(function(){
    this.attr('cursor', null);
  })

  //グループ内に要素が何もないグループの削除
  var svg_str = original_draw.svg(); //serialとsvg_strはグローバル関数である
  svg_str = svg_str.replace( /\n/g , "" );
  svg_str = svg_str.replace( />/g , ">\n" );
  svg_str = svg_str.replace( /svgjs:data="{&quot;leading&quot;:&quot;1.3&quot;}"/g , "" )
  //現在の<svg>内のデータをcurrent_svgに記録
  var current_svg= ""
  draw.select('defs').each(function(){  //defs要素の全削除
    this.remove()
  })
  SVG.get('svg_draw_area').each(function(i, children){
    current_svg +=this.svg();
  })
  var viewbox = draw.viewbox();
  continue_setSVG(current_svg,viewbox.x,viewbox.y,viewbox.width,viewbox.height)

  return svg_str;
}


/******************************************************
//ダウンロード時に出力svgファイルをフォーマットする関数
//返却値はpng形式のテキストデータ
******************************************************/

function download_setPNG(original_draw) { //ダウンロード時に出力pngファイルをフォーマットする関数
  var viewbox = draw.viewbox();
  if(draw.select('.A4').first().style('display')!=='none'){
    var rotation = draw.select('.A4').first().transform('rotation')
    if(Math.abs(rotation) === 90){
      draw.viewbox(-367.5 - GUIDE_STROKE_WIDTH/2  , -519.75 - GUIDE_STROKE_WIDTH/2, 735 , 1039.5 )
      draw.attr('width' , '2205').attr('height' , '3118.5')
    }else{
      draw.viewbox(-519.75 - GUIDE_STROKE_WIDTH/2 , -367.5 - GUIDE_STROKE_WIDTH/2 ,1039.5 , 735)
      draw.attr('width' , '3118.5').attr('height' , '2205')
    }
  }else{
    var rotation = draw.select('.B4').first().transform('rotation')
    if(Math.abs(rotation) === 90){
      draw.viewbox( -899/2 - GUIDE_STROKE_WIDTH/2, -1274/2 - GUIDE_STROKE_WIDTH/2 , 899 ,1274 )
      draw.attr('width' , '2697').attr('height' , '3822')
    }else{
      draw.viewbox(-1274/2 - GUIDE_STROKE_WIDTH/2, -899/2 - GUIDE_STROKE_WIDTH/2 ,1274 , 899)
      draw.attr('width' , '3822').attr('height' , '2697')
    }
  }
  draw.rect(1274, 1274).addClass('background_rect').back().move(-1274/2 , -1274/2).attr({'fill' : '#ffffff'})
  dummy_delete();
  edit_image(false);
  edit_clear();
  toConnected();
  select_rect_delete(); //select_rectの全削除
  circle_delete(); //edit_circleの全削除
  //不要なグループの削除
  SVG.get('gridline_group').remove();
  SVG.get('handle_group').remove();

  //グループ内に要素が何もないグループの削除
  var png_str = original_draw.svg(); //serialとsvg_strはグローバル関数である
  png_str = png_str.replace( /\n/g , "" );
  png_str = png_str.replace( />/g , ">\n" );

  //現在の<svg>内のデータをcurrent_svgに記録
  var current_svg= ""
  draw.select('defs').each(function(){  //defs要素の全削除
    this.remove()
  })
  draw.select('.background_rect').each(function(){  //png化用の背景の全削除
    this.remove()
  })
  SVG.get('svg_draw_area').each(function(i, children){
    current_svg +=this.svg();
  })
  continue_setSVG(current_svg,viewbox.x,viewbox.y,viewbox.width,viewbox.height)

  return png_str;
}



function continue_setSVG(input_draw,vx,vy,vwidth,vheight){ //svgデータを読み込み再初期化する関数
  //html内の#draw_areaを削除して再配置
  $('#draw_area').remove();
  var draw_area = $('<div id="draw_area"></div>');
  $("#draw_include").append(draw_area);
  //drawの内容を再設定
  draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area')
  draw.viewbox(vx, vy, vwidth, vheight)
  draw.svg(input_draw)
  defs_set()
  set_zoom()
  set_handle() //移動用ハンドル描画
  draw_gridline(3000,3000,50,50)//グリッド線の描画
  draw_guiderect() //ガイドの描画
  if(SVG.get('image_group')!==null)SVG.get('image_group').back() //image_groupをレイヤで一番後ろに
  checkBox_change();
  //現在のモードを記憶
  var current_mode =  $('input[name="Stamp"]:checked');
  $(current_mode).prop('checked', true).trigger('change'); //モードを設定
  $("#gridline").prop('checked', $('#gridline').prop('checked')).change()
}
