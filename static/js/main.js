var g_dataset_list = {};

//创建任务时任务参数dic
var g_train_task_parms = {};

//保存刷新项目任务时需要使用的项目id及type
var g_view_project_task_id = "";
var g_view_project_task_type = "classification";
var g_view_project_task_name = "新建项目";

//用于刷新任务定时器句柄
var g_instance_refresh_clock;
//用于刷新下载进度定时器句柄
var g_instance_download_demo_clock;

//浏览数据集变量
var g_dataset_files = {};
var g_dataset_train_files = {};
var g_dataset_evaluate_files = {};
var g_dataset_test_files = {};
//记录当前页
var g_current_dataset_page = 1;
//每页显示几张图片
var g_const_imgs_per_page = 3;
//当前标签
var g_current_dataset_lable_name = "";
//是否显示标注
var g_b_show_img_labels = false;
//显示数据集范围(默认全量数据)
var g_b_show_dataset_type = "all";

//数据集状态
var DatasetStatus = {
    XEMPTY:0, //空数据集
    XCHECKING:1, //正在验证数据集
    XCHECKFAIL:2, //数据集验证失败
    XCOPYING:3, //正在导入数据集
    XCOPYDONE:4, //数据集导入成功
    XCOPYFAIL:5, //数据集导入失败
    XSPLITED:6  //数据集已经切分
};

//任务状态
var TaskStatus = {
    XUNINIT:0, //任务还未初始化
    XINIT:1, //任务初始化
    XDOWNLOADING:2, //正在下载预训练模型
    XTRAINING:3, //任务正在运行中，该状态下任务不能被删除
    XTRAINDONE:4, //任务完成运行
    XEVALUATED:5, //任务评估完成
    XEXPORTING:6,  //任务正在导出inference模型
    XEXPORTED:7, //任务已经导出模型
    XTRAINEXIT:8, //任务运行中止
    XDOWNLOADFAIL:9, //任务下载失败
    XTRAINFAIL:10, //任务运行失败
    XEVALUATING:11,  //任务评估中
    XEVALUATEFAIL:12, //任务评估失败
    XEXPORTFAIL:13, //任务导出模型失败
    XPRUNEING:14, //裁剪分析任务运行中
    XPRUNETRAIN:15  //裁剪训练任务运行中
};

//下载状态
var DownloadStatus = {
    XDDOWNLOADING:0, //下载中
    XDDOWNLOADFAIL:1, //下载失败
    XDDOWNLOADDONE:2,//下载完成
    XDDECOMPRESSED:3//解压完成
};

//预测状态
var PredictStatus = {
    XPRESTART:0, //预测开始
    XPREDONE:1,//预测完成
    XPREFAIL:2 //预测失败
};

//参数范围
var Model_List = {
    "classification":["MobileNetV2", "ResNet18", "ResNet50_vd_ssld", "ResNet101_vd_ssld",
              "MobileNetV3_small_ssld", "MobileNetV3_large_ssld"],
     "detection":["YOLOv3", "FasterRCNN", "PPYOLO", "PPYOLOTiny", "PPYOLOv2"],
     "segmentation":["DeepLabV3P", "BiSeNetV2", "U-Net", "HRNet_W18", "FastSCNN"],
     "instance_segmentation":["MaskRCNN"]
}

var Backbone_List = {
    "YOLOv3": ['MobileNetV1', 'MobileNetV1_ssld', 'MobileNetV3',
             'MobileNetV3_ssld', 'DarkNet53', 'ResNet50_vd_dcn', 'ResNet34'],
    "PPYOLO": ['ResNet50_vd_dcn', 'ResNet18_vd', 'MobileNetV3_large', 'MobileNetV3_small'],
    PPYOLOTiny: ['MobileNetV3'],
    PPYOLOv2: ['ResNet50_vd_dcn', 'ResNet101_vd_dcn'],
    "FasterRCNN": ['ResNet50', 'ResNet50_vd', 'ResNet50_vd_ssld', 'ResNet34',
                 'ResNet34_vd', 'ResNet101', 'ResNet101_vd', 'HRNet_W18'],
    "DeepLabV3P": ['ResNet50_vd', 'ResNet101_vd'],
    "MaskRCNN": ['ResNet50', 'ResNet50_vd', 'ResNet50_vd_ssld', 'ResNet101', 'ResNet101_vd']
}

var Project_Type_Name_Enum = {
    "classification":"图像分类",
    "detection":"目标检测",
    "segmentation":"语义分割",
    "instance_segmentation":"实例分割"
}

var Nav_Bar_Type_Enum = {
    "datasets":"全部数据集",
    "projects":"全部项目",
    "tasks":"全部任务",
    "models":"全部模型",
    "project_tasks":"项目任务"
}

//显示服务器配置窗口 
function show_server_info(input_data)
{
    var srv_url_text = document.getElementById('server_url_text');
    srv_url_text.value = str_srv_url;

    var input_crt_prj_win = document.getElementById('input_win_cfg_server');
    var input_crt_prj_win_over = document.getElementById('input_win_cfg_server_over');
    input_crt_prj_win.style.display = "block";
    input_crt_prj_win_over.style.display = "block";
}


//隐藏服务器配置窗口
function hide_server_info(input_data)
{
    var on_win_user = document.getElementById('input_win_cfg_server');
    var over_win_user = document.getElementById('input_win_cfg_server_over');
    on_win_user.style.display = "none";
    over_win_user.style.display = "none";
}

//创建项目弹出窗口
function show_create_project_win_modal(obj)
{
    var prj_name_text = document.getElementById('project_name_text');
    project_name_text.value='新建项目';

    //加载项目对应的数据集列表
    str_project_type = "classification";
    var obj_sel_create_project_type = document.getElementById('project_type_text');
    obj_sel_create_project_type.value=str_project_type;

    //加载数据集信息及默认参数
    var obj_sel_create_project_dataset_id = document.getElementById('create_project_dataset_id_text');
    obj_sel_create_project_dataset_id.options.length = 0
    obj_sel_create_project_dataset_id.options[0] = new Option("请选择项目对应数据集", 0);

    var http_request = new XMLHttpRequest();
    http_request.open("GET", str_srv_url + "/dataset", false);
    http_request.send(null);
    str_json_datasets = http_request.responseText;

    //取出对应类型的数据集
    var str_json = eval('(' + str_json_datasets + ')');
    var obj_datasets = str_json["datasets"];
    g_dataset_list = obj_datasets;
    for(var p in obj_datasets)
    {
        str_id = obj_datasets[p].id;
        str_attr = obj_datasets[p].attr;
        str_name = str_attr["name"];
        str_desc = str_attr["desc"];
        str_type = str_attr["type"];
        //str_crttime = str_attr["create_time"]
        str_status = str_attr["dataset_status"]
        if(str_status == DatasetStatus.XSPLITED && str_type == str_project_type)
        {
            obj_sel_create_project_dataset_id.options[obj_sel_create_project_dataset_id.options.length] = new Option(str_name, str_id);
        }
    }

    var input_crt_prj_win = document.getElementById('input_win_create_project');
    var input_crt_prj_win_over = document.getElementById('input_win_create_project_over');
    input_crt_prj_win.style.display = "block";
    input_crt_prj_win_over.style.display = "block";
}

//隐藏创建项目弹出窗口
function hide_create_prj_win_modal(obj)
{
    var on_win_create_prj = document.getElementById('input_win_create_project');
    var over_win_create_prj = document.getElementById('input_win_create_project_over');
    on_win_create_prj.style.display = "none";
    over_win_create_prj.style.display = "none";
}

//显示创建数据集弹出窗口
function show_create_dataset_win_modal(obj)
{
    var dataset_name_text = document.getElementById('dataset_name_text');
    dataset_name_text.value='新建数据集';

    var input_crt_dataset_win = document.getElementById('input_win_create_dataset');
    var input_crt_dataset_win_over = document.getElementById('input_win_create_dataset_over');
    input_crt_dataset_win.style.display = "block";
    input_crt_dataset_win_over.style.display = "block";
}

//隐藏创建数据集弹出窗口
function hide_create_dataset_win_modal(obj)
{
    var on_win_create_dataset = document.getElementById('input_win_create_dataset');
    var over_win_create_dataset = document.getElementById('input_win_create_dataset_over');
    on_win_create_dataset.style.display = "none";
    over_win_create_dataset.style.display = "none";
}

//显示导入数据集弹出窗口
function show_import_dataset_win_modal(obj)
{
    var on_win_import_dataset = document.getElementById('input_win_import_dataset');
    var over_win_import_dataset = document.getElementById('input_win_import_dataset_over');
    var input_import_dataset_id = document.getElementById('import_dataset_id');

    on_win_import_dataset.style.display = "block";
    over_win_import_dataset.style.display = "block";

    input_import_dataset_id.value = obj.id;
}

//隐藏导入数据集弹出窗口
function hide_import_dataset_win_modal(obj)
{
    var on_win_import_dataset = document.getElementById('input_win_import_dataset');
    var over_win_import_dataset = document.getElementById('input_win_import_dataset_over');
    var input_import_dataset_id = document.getElementById('import_dataset_id');

    on_win_import_dataset.style.display = "none";
    over_win_import_dataset.style.display = "none";
    input_import_dataset_id.value = "";
}

//重新切分数据集
function re_split_dataset(obj)
{
    var on_win_split_dataset = document.getElementById('input_win_split_dataset');
    var over_win_split_dataset = document.getElementById('input_win_split_dataset_over');

    //获取需要切分的数据集ID
    document.getElementById('split_dataset_id').value = document.getElementById('browse_dataset_id').value;

    on_win_split_dataset.style.display = "block";
    over_win_split_dataset.style.display = "block";
}

//切分数据集弹出窗口
function show_split_dataset_win_modal(obj)
{
    var on_win_split_dataset = document.getElementById('input_win_split_dataset');
    var over_win_split_dataset = document.getElementById('input_win_split_dataset_over');
    var input_split_dataset_id = document.getElementById('split_dataset_id');

    on_win_split_dataset.style.display = "block";
    over_win_split_dataset.style.display = "block";

    input_split_dataset_id.value = obj.id;
}

//隐藏切分数据集弹出窗口
function hide_split_dataset_win_modal(obj)
{
    var on_win_split_dataset = document.getElementById('input_win_split_dataset');
    var over_win_split_dataset = document.getElementById('input_win_split_dataset_over');
    var input_split_dataset_id = document.getElementById('split_dataset_id');

    on_win_split_dataset.style.display = "none";
    over_win_split_dataset.style.display = "none";
    input_split_dataset_id.value = "";
}

//获取数据集详细信息
function get_dataset_detail_info(str_dataset_id)
{
    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
        http_request.withCredentials = true;
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }

    http_request.open("GET",str_srv_url + "/dataset/details?did=" + str_dataset_id, false);
    http_request.send(null);

    var str_dataset_detail_info = http_request.responseText;
    return str_dataset_detail_info;
}

//加载图片
function load_labels_imgs(str_lbl_name, int_page = 1)
{
     var lst_img_files = g_dataset_files[str_lbl_name];
     if (g_b_show_dataset_type == "all")
     {
         lst_img_files = g_dataset_files[str_lbl_name];
     }
     else if (g_b_show_dataset_type == "train")
     {
         lst_img_files = g_dataset_train_files[str_lbl_name];
     }
     else if (g_b_show_dataset_type == "evaluate")
     {
         lst_img_files = g_dataset_evaluate_files[str_lbl_name];
     }
     else if (g_b_show_dataset_type == "test")
     {
         lst_img_files = g_dataset_test_files[str_lbl_name];
     }

     var str_dataset_id = document.getElementById('browse_dataset_id').value;
     //获取数据集路径
     var str_dataset_path = document.getElementById('view_dataset_path_' + str_dataset_id).value;

     var curr_file_idx = g_const_imgs_per_page * (int_page - 1);

     var img_count = 0;
     for(var j=curr_file_idx;j<lst_img_files.length;j++)
     {
         var str_img_file_name = lst_img_files[j];
         var str_img_file = str_dataset_path + "/" + str_img_file_name;
         //是否显示标注
         var str_img_file_content = "";
         if(g_b_show_img_labels == true)
         {
             str_img_file_content = get_img_file_from_server(str_img_file, str_dataset_id);
         }
         else
         {
             str_img_file_content = get_img_file_from_server(str_img_file);
         }
         //更新img框内容
         img_count = img_count + 1;
         var obj_img = document.getElementById('dataset_img_' + img_count);
         var idx_file_postfix = str_img_file_name.lastIndexOf(".");
         var str_file_type = "jpeg";
         if(idx_file_postfix >= 0)
         {
             str_file_type = str_img_file_name.substring(idx_file_postfix + 1,str_img_file_name.length);
         }

         str_file_type = str_file_type.toLowerCase();

         var str_b64_type = "data:image/jpeg;base64,";

         if(str_file_type == "jpg" || str_file_type == "jpeg")
             str_b64_type = "data:image/jpeg;base64,";
         else if (str_file_type == "bmp")
             str_b64_type = "data:image/jpeg;base64,";
         else if (str_file_type == "png")
             str_b64_type = "data:image/png;base64,";

         obj_img.src = str_b64_type + str_img_file_content;
         obj_img.style.visibility='';

         //更新文件名称
         var idx_path_split = str_img_file_name.lastIndexOf("/");
         var str_img_file_shot_name = str_img_file_name;
         if(idx_path_split >= 0)
         {
             str_img_file_shot_name = str_img_file_name.substring(idx_path_split + 1,str_img_file_name.length);
         }
         document.getElementById('dataset_img_' + img_count + "_file_name").innerText = str_img_file_shot_name;
         if(img_count >= g_const_imgs_per_page)
         {
             break;
         }
     }

     //清除无需显示的图像框
     if(img_count < g_const_imgs_per_page)
     {
         for(var k=img_count + 1;k<=g_const_imgs_per_page;k++)
         {
             document.getElementById('dataset_img_' + k).src = " ";
             document.getElementById('dataset_img_' + k).style.visibility='hidden';
             document.getElementById('dataset_img_' + k + "_file_name").innerText = "";
         }
     }
}

//从服务端请求文件内容
function get_img_file_from_server(str_file_name, str_dataset_id = "")
{
    var http_request = new XMLHttpRequest();
    if(str_dataset_id == "")
    {
        http_request.open("GET", str_srv_url + "/file?path=" + str_file_name, false);
    }
    else
    {
        http_request.open("GET", str_srv_url + "/file?path=" + str_file_name + "&did=" + str_dataset_id, false);
    }
    http_request.send(null);

    var obj_json = eval('(' + http_request.responseText + ')');
    var str_data = obj_json["img_data"];
    return str_data;
}

//从服务端获取日志文件
function get_log_file_from_server(str_log_file_name)
{
    var http_request = new XMLHttpRequest();
    http_request.open("GET", str_srv_url + "/file?path=" + str_log_file_name, false);
    http_request.send(null);

    return http_request.responseText;
}

//从服务器获取一张图片数据，用于数据集图片预览向前及向后
var g_curr_img_file_idx = 0;
var g_dbl_clk_img_frame_id = "dataset_img_1";

function get_one_img_file(str_dir = "next")
{
    var lst_img_files = g_dataset_files[g_current_dataset_lable_name];

    if (g_b_show_dataset_type == "all")
    {
        lst_img_files = g_dataset_files[g_current_dataset_lable_name];
    }
    else if (g_b_show_dataset_type == "train")
    {
        lst_img_files = g_dataset_train_files[g_current_dataset_lable_name];
    }
    else if (g_b_show_dataset_type == "evaluate")
    {
        lst_img_files = g_dataset_evaluate_files[g_current_dataset_lable_name];
    }
    else if (g_b_show_dataset_type == "test")
    {
        lst_img_files = g_dataset_test_files[g_current_dataset_lable_name];
    }

    //数据集ID
    var str_dataset_id = document.getElementById('browse_dataset_id').value;
    //获取数据集路径
    var str_dataset_path = document.getElementById('view_dataset_path_' + str_dataset_id).value;

    var idx_img_frame_postfix = g_dbl_clk_img_frame_id.lastIndexOf("_");
    var idx_img_frame = 0;
    if(idx_img_frame_postfix >= 0)
    {
        idx_img_frame = parseInt(g_dbl_clk_img_frame_id.substring(idx_img_frame_postfix + 1,g_dbl_clk_img_frame_id.length)) - 1;
    }

    if (g_curr_img_file_idx == 0)
    {
        g_curr_img_file_idx = g_const_imgs_per_page * (g_current_dataset_page - 1) + idx_img_frame;
    }

    if(str_dir == "next")
    {
        g_curr_img_file_idx++;
        document.getElementById('arrow_pre_img').style.borderColor='blue';
    }
    else
    {
        g_curr_img_file_idx--;
        document.getElementById('arrow_next_img').style.borderColor='blue';
    }


    if(g_curr_img_file_idx <= 0)
    {
        g_curr_img_file_idx = 0;
        document.getElementById('arrow_pre_img').style.borderColor='gray';
    }
    if(g_curr_img_file_idx >= lst_img_files.length)
    {
        g_curr_img_file_idx = lst_img_files.length;
        document.getElementById('arrow_next_img').style.borderColor='gray';
    }

    var str_img_file_name = lst_img_files[g_curr_img_file_idx];
    var str_img_file = str_dataset_path + "/" + str_img_file_name;
    //是否显示标注
    var str_img_file_content = "";
    if(g_b_show_img_labels == true)
    {
        str_img_file_content = get_img_file_from_server(str_img_file, str_dataset_id);
    }
    else
    {
        str_img_file_content = get_img_file_from_server(str_img_file);
    }
    //更新img框内容
    var obj_img = document.getElementById('dataset_browse_img');
    var idx_file_postfix = str_img_file_name.lastIndexOf(".");
    var str_file_type = "jpeg";
    if(idx_file_postfix >= 0)
    {
        str_file_type = str_img_file_name.substring(idx_file_postfix + 1,str_img_file_name.length);
    }

    str_file_type = str_file_type.toLowerCase();

    var str_b64_type = "data:image/jpeg;base64,";

    if(str_file_type == "jpg" || str_file_type == "jpeg")
        str_b64_type = "data:image/jpeg;base64,";
    else if (str_file_type == "bmp")
        str_b64_type = "data:image/jpeg;base64,";
    else if (str_file_type == "png")
        str_b64_type = "data:image/png;base64,";

    obj_img.src = str_b64_type + str_img_file_content;
}

//刷新翻页按纽
function refresh_dataset_page_buttons()
{
    var int_file_count = g_dataset_files[g_current_dataset_lable_name].length;
    if (g_b_show_dataset_type == "all")
    {
        int_file_count = g_dataset_files[g_current_dataset_lable_name].length;
    }
    else if (g_b_show_dataset_type == "train")
    {
        int_file_count = g_dataset_train_files[g_current_dataset_lable_name].length;
    }
    else if (g_b_show_dataset_type == "evaluate")
    {
        int_file_count = g_dataset_evaluate_files[g_current_dataset_lable_name].length;
    }
    else if (g_b_show_dataset_type == "test")
    {
        int_file_count = g_dataset_test_files[g_current_dataset_lable_name].length;
    }

    var max_page_num = Math.ceil(int_file_count / g_const_imgs_per_page);

    document.getElementById('dataset_page_info').innerText = "第" + g_current_dataset_page + "页/共" + max_page_num + "页";
}

//加载数据标签信息
function add_labels_to_table(str_lbl_list,dic_file_lst,dic_train_lst,dic_evaluate_lst,dic_test_lst)
{
    g_dataset_files = dic_file_lst;
    g_dataset_train_files = dic_train_lst;
    g_dataset_evaluate_files = dic_evaluate_lst;
    g_dataset_test_files = dic_test_lst;

    var rows = table_dataset_labels.rows.length;
    for (i=rows-1;i>=1;i--)
    {
        table_dataset_labels.deleteRow(i);
    }

    for(var j=0;j<str_lbl_list.length;j++)
    {
        var str_lbl_name = str_lbl_list[j];
        var lst_files = dic_file_lst[str_lbl_name];
        var lst_train_files = dic_train_lst[str_lbl_name];
        var lst_evaluate_files = dic_evaluate_lst[str_lbl_name];
        var lst_test_files = dic_test_lst[str_lbl_name];

        var rows = table_dataset_labels.rows.length;
        var newTr = table_dataset_labels.insertRow(rows);
        newTr.id = str_lbl_name;
        newTr.onclick=function()
        {
            g_current_dataset_page = 1;
            g_current_dataset_lable_name = this.id;

            var tbl_trs = table_dataset_labels.getElementsByTagName("tr");
            for(var k = 1; k < tbl_trs.length; k++)
            {
                var bg_color = "#f2f2f2";
                if(k % 2 == 0)
                {
                    bg_color = "#ffffff";
                }
                else
                {
                    bg_color = "#f2f2f2";
                }
                if(k == this.rowIndex)
                {
                    bg_color = "#76D6FF";
                }
                tbl_trs[k].style.backgroundColor = bg_color;
            }

            load_labels_imgs(this.id, g_current_dataset_page);
            refresh_dataset_page_buttons();
        }

        newTr.style.cursor="pointer";
        if(j == 0)
        {
            newTr.style.backgroundColor = "#76D6FF";
        }

        var newTd0=newTr.insertCell();
        newTd0.innerText = str_lbl_name;

        var newTd1=newTr.insertCell();
        newTd1.innerText = lst_files.length;

        var newTd2=newTr.insertCell();
        newTd2.innerText = lst_train_files.length;

       var newTd3=newTr.insertCell();
        newTd3.innerText = lst_evaluate_files.length;

        var newTd4=newTr.insertCell();
        newTd4.innerText = lst_test_files.length;
    }
}

//浏览数据集弹出窗口
function show_browse_dataset_win_modal(obj)
{
    var on_win_browse_dataset = document.getElementById('win_browse_dataset');
    var over_win_browse_dataset = document.getElementById('win_browse_dataset_over');
    document.getElementById('browse_dataset_id').value = obj.id;

    var str_dataset_details = get_dataset_detail_info(obj.id);

    var obj_json_dataset_details = eval('(' + str_dataset_details + ')');
    var lst_labels = obj_json_dataset_details["details"]["labels"];
    var lst_files = obj_json_dataset_details["details"]["label_info"];

    //训练集及测试集
    var lst_train_files = obj_json_dataset_details["details"]["class_train_file_list"];
    var lst_evaluate_files = obj_json_dataset_details["details"]["class_val_file_list"];
    var lst_test_files = obj_json_dataset_details["details"]["class_test_file_list"];

    //数据集详情
    document.getElementById('browse_dataset_name_text').value = document.getElementById('view_dataset_name_' + obj.id).value;
    document.getElementById('browse_dataset_type_text').value = document.getElementById('view_dataset_type_' + obj.id).value;
    document.getElementById('browse_dataset_desc_text').value = document.getElementById('view_dataset_desc_' + obj.id).value;

    //分类不需要显示标注
    if(document.getElementById('browse_dataset_type_text').value == "图像分类")
    {
        document.getElementById('dataset_chk_show_label').style.visibility = "hidden";
        document.getElementById('dataset_chk_show_label_txt').style.visibility = "hidden";
    }
    else
    {
        document.getElementById('dataset_chk_show_label').style.visibility = "";
        document.getElementById('dataset_chk_show_label_txt').style.visibility = "";
    }

    //默认不显示标注
    g_b_show_img_labels = false;
    document.getElementById('dataset_chk_show_label').checked = false;

    //默认显示全量数据
    g_b_show_dataset_type = "all";
    document.getElementById('sel_dataset_view_type')[0].selected = true;

    //刷新标签
    add_labels_to_table(lst_labels, lst_files, lst_train_files, lst_evaluate_files, lst_test_files);

    //加载预览图片
    g_current_dataset_lable_name = lst_labels[0];
    load_labels_imgs(lst_labels[0],g_current_dataset_page);

    //刷新翻页按纽
    refresh_dataset_page_buttons();

    on_win_browse_dataset.style.display = "block";
    over_win_browse_dataset.style.display = "block";
}

//关闭浏览数据集
function hide_browse_dataset_win_modal(obj)
{
    //当前页重置
    g_current_dataset_page = 1;
    g_b_show_dataset_type = "all";

    var on_win_browse_dataset = document.getElementById('win_browse_dataset');
    var over_win_browse_dataset = document.getElementById('win_browse_dataset_over');
    document.getElementById('browse_dataset_id').value = "";

    on_win_browse_dataset.style.display = "none";
    over_win_browse_dataset.style.display = "none";
}

//双击放大图像
function zoom_image(obj)
{
    g_curr_img_file_idx = 0;
    g_dbl_clk_img_frame_id = obj.id;

    if(g_dbl_clk_img_frame_id.indexOf("dataset") >= 0)
    {

        document.getElementById('arrow_pre_img').style.borderColor='blue';
        document.getElementById('arrow_next_img').style.borderColor='blue';
    }
    else
    {
        document.getElementById('arrow_pre_img').style.borderColor='gray';
        document.getElementById('arrow_next_img').style.borderColor='gray';
    }

    if(obj.src != "")
    {
        document.getElementById('dataset_browse_img').src = obj.src;
        var on_win_browse_img = document.getElementById('win_browse_img');
        var over_win_browse_img = document.getElementById('win_browse_img_over');

        on_win_browse_img.style.display = "block";
        over_win_browse_img.style.display = "block";
    }
}

//关闭放大预览图片窗口
function hide_zoom_img(obj)
{
    g_curr_img_file_idx = 0;

    var on_win_browse_img = document.getElementById('win_browse_img');
    var over_win_browse_img = document.getElementById('win_browse_img_over');

    on_win_browse_img.style.display = "none";
    over_win_browse_img.style.display = "none";
}

//关闭日志查看窗口
function hide_log_win(obj)
{
    var on_win_view_log = document.getElementById('win_view_log');
    var over_win_view_log = document.getElementById('win_view_log_over');

    on_win_view_log.style.display = "none";
    on_win_view_log.style.display = "none";
}

//上一页
function dataset_pre_page()
{
    g_current_dataset_page = g_current_dataset_page - 1;
    if(g_current_dataset_page <= 0)
    {
        g_current_dataset_page = 1;
    }

    load_labels_imgs(g_current_dataset_lable_name, g_current_dataset_page);

    refresh_dataset_page_buttons();
}

//下一页
function dataset_next_page()
{
    g_current_dataset_page = g_current_dataset_page + 1;

    //是否大于最大页
    var int_file_max_count = g_dataset_files[g_current_dataset_lable_name].length;
    if (g_b_show_dataset_type == "all")
    {
        int_file_max_count = g_dataset_files[g_current_dataset_lable_name].length;
    }
    else if (g_b_show_dataset_type == "train")
    {
        int_file_max_count = g_dataset_train_files[g_current_dataset_lable_name].length;
    }
    else if (g_b_show_dataset_type == "evaluate")
    {
        int_file_max_count = g_dataset_evaluate_files[g_current_dataset_lable_name].length;
    }
    else if (g_b_show_dataset_type == "test")
    {
        int_file_max_count = g_dataset_test_files[g_current_dataset_lable_name].length;
    }

    if(g_current_dataset_page * g_const_imgs_per_page > int_file_max_count + 2)
    {
        g_current_dataset_page = g_current_dataset_page - 1;
    }

    load_labels_imgs(g_current_dataset_lable_name, g_current_dataset_page);

    refresh_dataset_page_buttons();
}

//显示全量数据或者其他数据
function change_dataset_view_type(obj)
{
    g_b_show_dataset_type = obj.value;
    g_current_dataset_page = 1;
    load_labels_imgs(g_current_dataset_lable_name, g_current_dataset_page);

    refresh_dataset_page_buttons();
}

//显示标注
function show_dataset_labels()
{
    g_b_show_img_labels = !g_b_show_img_labels;
    load_labels_imgs(g_current_dataset_lable_name, g_current_dataset_page);
}

//秒转换为日期
function left_second_to_time(int_sec = 0)
{
    var time_sec = parseInt(int_sec);
    var time_min = 0;
    var time_hour = 0;
    var time_day = 0;
    if(time_sec > 60)
    {
        time_min = parseInt(time_sec/60);
        time_sec = parseInt(time_sec%60);
        if(time_min > 60)
        {
            time_hour = parseInt(time_min/60);
            time_min = parseInt(time_min%60);
            if(time_hour > 24)
            {
                time_day = parseInt(time_hour/24);
                time_hour = parseInt(time_hour%24);
            }
        }
    }

    var result = '';
    if(time_sec > 0)
    {
        result = "" + parseInt(time_sec) + "秒";
    }
    if(time_min > 0)
    {
        result = "" + parseInt(time_min) + "分" + result;
    }
    if(time_hour > 0)
    {
        result = "" + parseInt(time_hour) + "小时" + result;
    }
    if(time_day > 0)
    {
        result = "" + parseInt(time_day) + "天" + result;
    }
    return result;
}

//根据任务状态更新任务信息UI
function update_task_detail_info_ui(str_view_task_id, b_get_task_parms = false)
{
    //获取任务信息，刷新任务窗口
    var http_request = new XMLHttpRequest();
    http_request.open("GET", str_srv_url + "/project/task?tid=" + str_view_task_id, false);
    http_request.send(null);

    var obj_json = eval('(' + http_request.responseText + ')');
    var str_task_msg = obj_json["message"];
    var str_task_status = obj_json["task_status"];

    var running_duration = "NA";
    var progress_bar_value = 0;
    var str_view_task_status_text = "任务初始化";
    var str_task_next_button_lable = "关闭"
    var obj_task_next_button = document.getElementById('btn_next_task_info');
    //停止任务按纽
    var obj_stop_task_div = document.getElementById('div_btn_stop_task');
    var b_show_stop_task_btn = false;

    if (str_task_status == TaskStatus.XINIT)
    {
        str_view_task_status_text = "任务初始化";
    }
    else if (str_task_status == TaskStatus.XTRAINFAIL)
    {
        str_view_task_status_text = "任务训练失败";

        str_task_next_button_lable = "查看错误日志";
    }
    else if (str_task_status == TaskStatus.XTRAINDONE)
    {
        str_view_task_status_text = "任务训练完成";
        progress_bar_value = 100;
        str_task_msg = "任务训练完成，请进行模型评估或者导出模型";

        //取消按纽更新为评估&导出模型
        str_task_next_button_lable = "评估&导出模型";
    }
    else if (str_task_status == TaskStatus.XTRAINING)
    {
        str_view_task_status_text = "任务训练中";
        b_show_stop_task_btn = true;

        //获取任务参数
        if(b_get_task_parms == true)
        {
            var train_parms_http_request = new XMLHttpRequest();
            train_parms_http_request.open("GET", str_srv_url + "/project/task/params?tid=" + str_view_task_id, false);
            train_parms_http_request.send(null);
            var obj_parms_json = eval('(' + train_parms_http_request.responseText + ')');
            g_train_task_parms = obj_parms_json["train"];
        }

        //获取训练状态
        var train_http_request = new XMLHttpRequest();
        train_http_request.open("GET", str_srv_url + "/project/task/metrics?tid=" + str_view_task_id + "&type=train", false);
        train_http_request.send(null);
        str_task_msg = train_http_request.responseText;
        try
        {
            var obj_train_msg_json = eval('(' + str_task_msg + ')');
            var dic_train_log_metric = obj_train_msg_json["train_log"]["train_metrics"];
            running_duration = obj_train_msg_json["train_log"]["running_duration"];
            var curr_epoc = dic_train_log_metric["Epoch"];
            var curr_step = dic_train_log_metric["Step"];
            var curr_acc1 = dic_train_log_metric["acc1"];
            var curr_acc5 = dic_train_log_metric["acc5"];
            var curr_loss = dic_train_log_metric["loss"];
            var curr_lr = dic_train_log_metric["lr"];
            var left_time = parseInt(obj_train_msg_json["train_log"]["eta"]);

            if(left_time > 0)
                running_duration = "已运行: " + running_duration + "  (估计剩余时间: " + left_second_to_time(left_time) + ")";

            //计算进度
            var cur_progress = parseInt((parseInt(curr_epoc)-1)/parseInt(g_train_task_parms["num_epochs"]) * 100);
            if(cur_progress > 100)
                cur_progress = 100;

            progress_bar_value = cur_progress;
        }
        catch(err)
        {
            str_view_task_status_text = "任务训练中（启动训练中）";
            progress_bar_value = 0;
            str_task_msg = "任务训练中（启动训练中），请稍等...";
        }

        //启动定时器，用于定时刷新任务状态
        if(b_get_task_parms)
        {
            g_instance_refresh_clock = self.setInterval("refresh_task_detail_info_win()",1000);
        }
    }
    else if (str_task_status == TaskStatus.XEXPORTING)
    {
        str_view_task_status_text = "任务训练完成（模型导出中）";
        progress_bar_value = 100;
        str_task_msg = "任务训练完成（模型导出中），可以重新进行模型评估或者导出模型";

        //取消按纽更新为评估&导出模型
        str_task_next_button_lable = "评估&导出模型";
    }
    else if (str_task_status == TaskStatus.XEXPORTED)
    {
        str_view_task_status_text = "任务训练完成（模型已导出）";
        progress_bar_value = 100;
        str_task_msg = "任务训练完成（模型已导出），可以重新进行模型评估或者导出模型";

        //取消按纽更新为评估&导出模型
        str_task_next_button_lable = "评估&导出模型";
    }
    else if (str_task_status == TaskStatus.XTRAINEXIT)
    {
        str_view_task_status_text = "任务已中止";
        progress_bar_value = 0;
        str_task_msg = "任务已中止，可以重新启动模型训练";

        //取消按纽更新为评估&导出模型
        str_task_next_button_lable = "继续训练";
    }

    var obj_view_task_status_text = document.getElementById('task_detail_status_text');
    obj_view_task_status_text.value = str_view_task_status_text;

    var obj_view_task_log_text = document.getElementById('task_detail_log_text');
    obj_view_task_log_text.value = str_task_msg;

    var obj_view_task_running_duration_text = document.getElementById('task_detail_running_duration_text');
    obj_view_task_running_duration_text.value = running_duration;

    //进度条
    var obj_view_task_status_progress_value = document.getElementById('task_detail_status_progress_bar_value');
    obj_view_task_status_progress_value.style = "width: " + progress_bar_value + "%;";
    var obj_view_task_status_progress_bar = document.getElementById('task_detail_status_progress_bar');
    obj_view_task_status_progress_value.innerText = progress_bar_value + "%";

    //按纽标题
    obj_task_next_button.value = str_task_next_button_lable;
    //停止任务按纽显示
    if(b_show_stop_task_btn == true)
    {
        obj_stop_task_div.style.visibility = "";
    }
    else
    {
        obj_stop_task_div.style.visibility = "hidden";
    }
}

//显示任务运行状态窗口
function show_task_detail_info_win_modal(obj)
{
    var input_task_detail_id = document.getElementById('task_detail_id');
    input_task_detail_id.value = obj.id;

    //获取任务信息，刷新任务窗口
    var str_view_task_id = obj.id;

    update_task_detail_info_ui(str_view_task_id, true);

    var task_detail_info_win = document.getElementById('task_detail_info');
    var task_detail_info_win_over = document.getElementById('task_detail_info_over');
    task_detail_info_win.style.display = "block";
    task_detail_info_win_over.style.display = "block";
}

//用于定时刷新任务运行状态窗口
function refresh_task_detail_info_win()
{
    var input_task_detail_id = document.getElementById('task_detail_id');
    var str_view_task_id = input_task_detail_id.value;

    update_task_detail_info_ui(str_view_task_id, false);
}

//关闭任务运行信息弹出窗口
function hide_task_detail_info_win_modal()
{
    var task_detail_info_win = document.getElementById('task_detail_info');
    var task_detail_info_win_over = document.getElementById('task_detail_info_over');
    var input_task_detail_id = document.getElementById('task_detail_id');

    task_detail_info_win.style.display = "none";
    task_detail_info_win_over.style.display = "none";
    input_task_detail_id.value = "";

    //关闭定时器
    g_instance_refresh_clock=window.clearInterval(g_instance_refresh_clock);
}

//模型训练结束下一步处理（模型评估&导出）
function task_next_step_process(obj)
{
    var str_btn_label = obj.value;
    if(str_btn_label == "关闭")
    {
        hide_task_detail_info_win_modal();
    }
    else if(str_btn_label == "查看错误日志")
    {
        var str_error_tid = document.getElementById('task_detail_id').value;
        var str_error_task_pid = document.getElementById('view_task_pid_' + str_error_tid).value;
        //日志路径
        var http_request = new XMLHttpRequest();
        http_request.open('GET', str_srv_url + "/workspace", false);
        http_request.send(null);

        var obj_json = eval('(' + http_request.responseText + ')');
        var str_server_workspace_path = obj_json["dirname"];
        var str_error_log_path = str_server_workspace_path + "/projects/" + str_error_task_pid + "/" + str_error_tid + "/err.log";

        var str_error_info = get_log_file_from_server(str_error_log_path);

        //显示错误信息
        document.getElementById('view_log_text').value = str_error_info;
        var on_win_view_log = document.getElementById('win_view_log');
        var over_win_view_log = document.getElementById('win_view_log_over');

        on_win_view_log.style.display = "block";
        on_win_view_log.style.display = "block";
    }
    else if(str_btn_label == "评估&导出模型")
    {
        //启动模型评估
        show_evaluate_export_win_modal(obj);
        //隐藏原来窗口
        hide_task_detail_info_win_modal();
    }
    else if(str_btn_label == "继续训练")
    {
        //重新启动模型训练
        var str_start_tid = "";
        var obj_start_task_id_input = document.getElementById('task_detail_id');
        str_start_tid = obj_start_task_id_input.value;

        start_task(str_start_tid);

        if (document.getElementById('btn_refresh').value == "刷新项目任务信息")
        {
            load_project_tasks(g_view_project_task_id);
        }
        else
        {
            load_tasks();
        }
        //隐藏原来窗口
        hide_task_detail_info_win_modal();
    }
}

//打开VDL链接
function open_task_vdl_window()
{
    var input_task_detail_id = document.getElementById('task_detail_id');
    var str_view_task_id = input_task_detail_id.value;

    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                //获取URL并打开
                str_json = http_request.responseText;
                var obj_json = eval('(' + str_json + ')');
                var str_vdl_url = obj_json["url"];
                //alert(str_vdl_url);
                window.open("http://" + str_vdl_url);
            }
            else
            {
                alert("打开失败，请检查服务器配置\n" + http_request.responseText);
            }
        }
    }

    http_request.open("GET", str_srv_url + "/project/task/vdl?tid=" + str_view_task_id, true);
    http_request.send(null);
}

//关闭评估&导出模型弹出窗口
function hide_evaluate_export_win_modal(obj)
{
    var obj_evaluate_export_task_project_id = document.getElementById('evaluate_export_task_project_id');
    obj_evaluate_export_task_project_id.value = "";

    document.getElementById('btn_evaluate_task_info').value = "启动评估";

    var on_win_evaluate_export_model = document.getElementById('input_win_evaluate_export_model');
    var over_win_evaluate_export_model = document.getElementById('input_win_evaluate_export_model_over');
    on_win_evaluate_export_model.style.display = "none";
    over_win_evaluate_export_model.style.display = "none";
}

//显示评估&导出模型弹出窗口
function show_evaluate_export_win_modal(obj)
{
    var obj_detail_task_id = document.getElementById('task_detail_id');
    var obj_export_task_id = document.getElementById('evaluate_export_task_id');
    obj_export_task_id.value = obj_detail_task_id.value;

    if(null == obj_export_task_id.value || 'undefined' == typeof(obj_export_task_id.value) || '' == obj_export_task_id.value)
    {
        obj_export_task_id.value = obj.id;
    }

    //初始化路径(workspace/projects/TXXX/export_model)
    var http_request = new XMLHttpRequest();
    http_request.open('GET', str_srv_url + "/workspace", false);
    http_request.send(null);

    var obj_json = eval('(' + http_request.responseText + ')');
    var str_init_model_save_path = obj_json["dirname"];

    var str_obj_task_prj_key = "view_task_pid_" + obj_export_task_id.value;
    var obj_project_id = document.getElementById(str_obj_task_prj_key);
    var str_project_id = obj_project_id.value;

    var obj_evaluate_export_task_project_id = document.getElementById('evaluate_export_task_project_id');
    obj_evaluate_export_task_project_id.value = str_project_id;

    var obj_model_save_path = document.getElementById('export_model_path_text');
    obj_model_save_path.value = str_init_model_save_path + "/projects/" + str_project_id + "/" + obj_export_task_id.value + "/export_model";

    var on_win_evaluate_export_model = document.getElementById('input_win_evaluate_export_model');
    var over_win_evaluate_export_model = document.getElementById('input_win_evaluate_export_model_over');
    on_win_evaluate_export_model.style.display = "block";
    over_win_evaluate_export_model.style.display = "block";
}

//评估任务
function evaluate_task(obj)
{
    if (document.getElementById('btn_evaluate_task_info').value == "评估中...")
    {
        alert("评估进行中，请稍候...");
        return;
    }

    var obj_evaluate_task_id = document.getElementById('evaluate_export_task_id');
    var str_evaluate_task_id = obj_evaluate_task_id.value;

    //启动评估
    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                //查询评估报告
                document.getElementById('btn_evaluate_task_info').value = "评估中...";
                g_evaluate_task_wait_times = 0;
                setTimeout(function(){get_evaluate_result(str_evaluate_task_id);}, 1000);
            }
            else
            {
                alert("启动评估失败，请检查服务器配置\n" + http_request.responseText);
            }
        }
    }

    var data = {"tid":str_evaluate_task_id,"epoch":null,"topk":5,'score_thresh':null, 'overlap_thresh':null};
    http_request.open("POST", str_srv_url + "/project/task/evaluate", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//获取任务评估状态和结果
var g_evaluate_task_wait_times = 0;

function get_evaluate_result(str_task_id)
{
    g_evaluate_task_wait_times = g_evaluate_task_wait_times + 1;

    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }

    http_request.open("GET", str_srv_url + "/project/task/evaluate?tid=" + str_task_id, false);
    http_request.send(null);

    var obj_json = eval('(' + http_request.responseText + ')');
    var str_evaluate_status = parseInt(obj_json["evaluate_status"]);

    if(str_evaluate_status == TaskStatus.XEVALUATED)
    {
        document.getElementById('btn_evaluate_task_info').value = "启动评估";
        alert("评估成功，详细信息:\n" + http_request.responseText);
    }
    else if(str_evaluate_status == TaskStatus.XEVALUATEFAIL)
    {
        document.getElementById('btn_evaluate_task_info').value = "启动评估";
        alert("评估失败，详细信息:\n" + http_request.responseText);
    }
    else if(str_evaluate_status == TaskStatus.XEVALUATING)
    {
        if(g_evaluate_task_wait_times <= 10)
        {
            setTimeout(function(){get_evaluate_result(str_task_id);}, 3000);
        }
    }
    else
    {
        if(g_evaluate_task_wait_times <= 10)
        {
            setTimeout(function(){get_evaluate_result(str_task_id);}, 3000);
        }
    }
}

//导出任务模型
function export_model(obj)
{
    //任务id
    var obj_export_task_id = document.getElementById('evaluate_export_task_id');
    var str_export_task_id = obj_export_task_id.value;

    //导出路径
    var str_model_save_path = "";
    var obj_model_save_path = document.getElementById('export_model_path_text');
    str_model_save_path = obj_model_save_path.value;

    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                //获取URL并打开
                alert("导出成功! 模型保存路径：" + str_model_save_path);
                //追加到导出模型列表
                var str_project_id = "";
                var obj_task_project_id = document.getElementById('evaluate_export_task_project_id');
                str_project_id = obj_task_project_id.value;

                var model_data = {"pid":str_project_id,"tid":str_export_task_id,"name":str_export_task_id + "_export_model","type":"exported","source_path":"","path":str_model_save_path,"exported_type":0,"eval_results":{}};
                var model_http_request = new XMLHttpRequest();
                model_http_request.open("POST", str_srv_url + "/model", false);
                model_http_request.setRequestHeader("Content-type","application/json");
                model_http_request.send(JSON.stringify(model_data));
            }
            else
            {
                alert("导出失败，请检查服务器配置\n" + http_request.responseText);
            }
        }
    }

    //默认epoch为自动获取最优
    var data = {"tid":str_export_task_id,"type":"infer","save_dir":str_model_save_path,'quant': false};
    http_request.open("POST", str_srv_url + "/project/task/export", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//联系方式
function contact_us()
{
    alert("请访问项目官网  https://github.com/qianbin1989228/PaddleStudio");
}

//刷新按纽
function refresh_contents(obj)
{
     if(obj.value == "刷新项目信息")
     {
         load_projects(obj);
     }
     else if (obj.value == "刷新数据集信息")
     {
         load_datasets(obj);
     }
     else if (obj.value == "刷新所有任务信息")
     {
         load_tasks(obj);
     }
     else if (obj.value == "刷新项目任务信息")
     {
         load_project_tasks(g_view_project_task_id);
     }
     else if (obj.value == "刷新模型信息")
     {
         load_models(obj);
     }
     else
     {
         load_projects(obj);
     }
}

//项目对象右键弹出菜单
function show_project_popupmenu(obj)
{
    var obj_project_id = document.getElementById('popup_menu_project_id');
    obj_project_id.value = obj.id;

    var menu = document.getElementById('popupmenu_project');
    menu.style.display = 'block';
    menu.style.left =  document.documentElement.scrollLeft + document.body.scrollLeft+ window.event.clientX + 'px';
    menu.style.top = document.documentElement.scrollTop + document.body.scrollTop+ window.event.clientY + 'px';
    window.event.returnValue=false;
    window.event.cancelBubble=true;
    window.event.preventDafault();
    window.event.stopPropagation();
    return false;
}

//数据集对象右键弹出菜单
function show_dataset_popupmenu(obj)
{
    var obj_dataset_id = document.getElementById('popup_menu_dataset_id');
    obj_dataset_id.value = obj.id;
    var menu = document.getElementById('popupmenu_dataset');
    menu.style.display = 'block';
    menu.style.left =  document.documentElement.scrollLeft + document.body.scrollLeft+ window.event.clientX + 'px';
    menu.style.top = document.documentElement.scrollTop + document.body.scrollTop+ window.event.clientY + 'px';
    window.event.returnValue=false;
    window.event.cancelBubble=true;
    window.event.preventDafault();
    window.event.stopPropagation();
    return false;
}

//任务对象右键弹出菜单
function show_task_popupmenu(obj)
{
    var obj_task_id = document.getElementById('popup_menu_task_id');
    obj_task_id.value = obj.id;
    var menu = document.getElementById('popupmenu_task');
    menu.style.display = 'block';
    menu.style.left =  document.documentElement.scrollLeft + document.body.scrollLeft+ window.event.clientX + 'px';
    menu.style.top = document.documentElement.scrollTop + document.body.scrollTop+ window.event.clientY + 'px';
    window.event.returnValue=false;
    window.event.cancelBubble=true;
    window.event.preventDafault();
    window.event.stopPropagation();
    return false;
}

//任务对象右键弹出菜单
function show_models_popupmenu(obj)
{
    var obj_model_id = document.getElementById('popup_menu_model_id');
    obj_model_id.value = obj.id;
    var menu = document.getElementById('popupmenu_model');
    menu.style.display = 'block';
    menu.style.left =  document.documentElement.scrollLeft + document.body.scrollLeft+ window.event.clientX + 'px';
    menu.style.top = document.documentElement.scrollTop + document.body.scrollTop+ window.event.clientY + 'px';
    window.event.returnValue=false;
    window.event.cancelBubble=true;
    window.event.preventDafault();
    window.event.stopPropagation();
    return false;
}

//隐藏右键菜单
document.onclick = function()
{
    var menu = document.getElementById('popupmenu_project');
    menu.style.display = 'none';
    var obj_project_id = document.getElementById('popup_menu_project_id');
    obj_project_id.value = "";

    menu = document.getElementById('popupmenu_dataset');
    menu.style.display = 'none';
    var obj_dataset_id = document.getElementById('popup_menu_dataset_id');
    obj_dataset_id.value = "";

    menu = document.getElementById('popupmenu_task');
    menu.style.display = 'none';
    var obj_task_id = document.getElementById('popup_menu_task_id');
    obj_task_id.value = "";

    menu = document.getElementById('popupmenu_model');
    menu.style.display = 'none';
    var obj_model_id = document.getElementById('popup_menu_model_id');
    obj_model_id.value = "";
}

//设置远端服务器地址
function set_server_addr(input_data)
{
    var input_srv_url = document.getElementById('server_url_text');
    str_srv_url = input_srv_url.value;

    var last_pos = str_srv_url.length - 1;
    var last_char = str_srv_url.charAt(last_pos);

    if(last_char == '/')
    {
        str_srv_url = str_srv_url.substring(0, (str_srv_url.length - 1));
    }

    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {

        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 str_json = http_request.responseText;
                 var obj_json = eval('(' + str_json + ')');
                 var str_workspace_dir = obj_json["dirname"];
                 alert("设置成功！\n服务器地址：" + str_srv_url + "\n服务器工作区路径：" + str_workspace_dir);

                 hide_server_info(null);
                 load_projects();
            }
            else
           {
                alert("设置失败，服务器连接失败，请检查服务器地址是否正确！" + http_request.responseText)
            }
        }
    }

    http_request.open('GET', str_srv_url + "/workspace", true);
    http_request.send(null);
}

//获取服务器系统信息
function get_server_system_info(str_info_type = "machine_info")
{
    var http_request = new XMLHttpRequest();

    http_request.open('GET', str_srv_url + "/system?type=" + str_info_type, false);
    http_request.send(null);

    return http_request.responseText;
}

//获取工作区所有项目信息
function load_projects()
{
    update_nav_bar(Nav_Bar_Type_Enum["projects"]);
    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if(http_request.readyState==4 && http_request.status==200)
        {
            //更新表格内容
            fill_table_contents(http_request.responseText, "project");
        }
        else
        {
            fill_table_with_error();
        }
    }
    http_request.open("GET",str_srv_url + "/project",true);
    http_request.send(null);
}

//创建项目
function create_project(input_data)
{
    var input_prj_name = document.getElementById('project_name_text');
    var input_prj_type = document.getElementById('project_type_text');
    var input_prj_desc = document.getElementById('project_desc_text');
    var input_prj_dataset = document.getElementById('create_project_dataset_id_text');

    var str_prj_name = input_prj_name.value;
    var str_prj_type = input_prj_type.value;
    var str_prj_desc = input_prj_desc.value;
    var str_prj_dataset_id = input_prj_dataset.value;

    if(str_prj_name == "")
    {
        alert("请输入项目名称");
        return;
    }

    if(str_prj_dataset_id == 0)
    {
        alert("请选择项目对应数据集或者创建数据集");
        return;
    }

    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 str_json = http_request.responseText;
                 alert("项目创建成功！\n" + str_json);
                 var obj_json = eval('(' + str_json + ')');
                 var str_new_pid = obj_json["pid"];

                 //绑定数据集
                 var attr_dict = {'did': str_prj_dataset_id};
                 var bind_params = {'struct': 'project', 'id': str_new_pid, 'attr_dict': attr_dict}
                 var bind_http_request = new XMLHttpRequest();
                 bind_http_request.open("PUT", str_srv_url + "/workspace", false);
                 bind_http_request.setRequestHeader("Content-type","application/json");
                 bind_http_request.send(JSON.stringify(bind_params));

                 hide_create_prj_win_modal();
                 load_projects();
            }
            else
            {
              alert("项目创建失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }


    var data = {"name":str_prj_name,"desc":str_prj_desc,"project_type":str_prj_type};
    http_request.open("POST", str_srv_url + "/project", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//对某个字段排序
function sort_compare(sort_field, sort_type = "asc")
{
    return function(a,b)
    {
        if(sort_type == "asc")
        {
            return a[sort_field].localeCompare(b[sort_field]);
        }
        else
        {
            return b[sort_field].localeCompare(a[sort_field]);
        }
    }
}

//查看一个项目
function show_project(data)
{
    g_view_project_task_id = data.id;
    g_view_project_task_type = document.getElementById("view_project_type_" + g_view_project_task_id).value;
    g_view_project_task_name = document.getElementById("view_project_name_" + g_view_project_task_id).value;
    //查看项目下的任务
    load_project_tasks(data.id);
}

//获取工作区所有数据集信息
function load_datasets()
{
    update_nav_bar(Nav_Bar_Type_Enum["datasets"]);
    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if(http_request.readyState==4 && http_request.status==200)
        {
            //更新表格内容
            fill_table_contents(http_request.responseText, "dataset");
        }
        else
        {
            fill_table_with_error();
        }
    }
    http_request.open("GET",str_srv_url + "/dataset",true);
    http_request.send(null);
}

//获取所有任务信息
function load_tasks()
{
    document.getElementById("btn_refresh").value = "刷新所有任务信息";
    document.getElementById("table_create_new").style.display = "none";
    update_nav_bar(Nav_Bar_Type_Enum["tasks"]);

    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if(http_request.readyState==4 && http_request.status==200)
        {
            //更新表格内容
            fill_table_contents(http_request.responseText, "task");
        }
        else
        {
            fill_table_with_error();
        }
    }
    http_request.open("GET",str_srv_url + "/project/task",true);
    http_request.send(null);
}

//获取项目下的任务
function load_project_tasks(str_project_id)
{
    document.getElementById("btn_refresh").value = "刷新项目任务信息";
    document.getElementById("table_create_new").style.display = "block";
    document.getElementById("btn_create_new").value = "新建任务";
    update_nav_bar(Nav_Bar_Type_Enum["project_tasks"]);

    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if(http_request.readyState==4 && http_request.status==200)
        {
            //更新表格内容
            fill_table_contents(http_request.responseText, "task");
        }
        else
        {
            fill_table_with_error();
        }
    }
    http_request.open("GET",str_srv_url + "/project/task?pid=" + str_project_id,true);
    http_request.send(null);
}

//创建数据集
function create_dataset(input_data)
{
    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("数据集创建成功！\n" + http_request.responseText);
                 hide_create_dataset_win_modal();
                 load_datasets();
            }
            else
            {
                alert("数据集创建失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }
    var input_dataset_name = document.getElementById('dataset_name_text');
    var input_dataset_type = document.getElementById('dataset_type_text');
    var input_dataset_desc = document.getElementById('dataset_desc_text');

    var str_dataset_name = input_dataset_name.value;
    var str_dataset_type = input_dataset_type.value;
    var str_dataset_desc = input_dataset_desc.value;

    if(str_dataset_name == "")
    {
        alert("请输入数据集名称");
        return;
    }

    var data = {"name":str_dataset_name,"desc":str_dataset_desc,"dataset_type":str_dataset_type};

    http_request.open("POST", str_srv_url + "/dataset", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//导入数据集
function import_dataset(obj)
{
    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("数据集导入成功！\n" + http_request.responseText);
                 hide_import_dataset_win_modal(obj);
                 load_datasets();
            }
            else
            {
                alert("数据集导入失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }

    var obj_import_dataset_id = document.getElementById('import_dataset_id');
    str_import_dataset_id = obj_import_dataset_id.value;

    var input_dataset_path = document.getElementById('import_dataset_path_text');

    var str_dataset_path = input_dataset_path.value;

    if(str_dataset_path == "")
    {
        alert("请输入数据集路径");
        return;
    }

    var data = {"did":str_import_dataset_id,"path":str_dataset_path};

    http_request.open("PUT", str_srv_url + "/dataset", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//切分数据集
function split_dataset(obj)
{
    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("数据集切分成功!\n" + http_request.responseText);
                 hide_split_dataset_win_modal(obj);
                 load_datasets();
            }
            else
            {
                alert("数据集切分失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }

    var obj_split_dataset_id = document.getElementById('split_dataset_id');
    var str_split_dataset_id = obj_split_dataset_id.value;

    var obj_split_dataset_var_percent = document.getElementById('split_dataset_val_percent');
    var val_split = obj_split_dataset_var_percent.value/100;

    var obj_split_dataset_test_percent = document.getElementById('split_dataset_test_percent');
    var test_split = obj_split_dataset_test_percent.value/100;

    var data = {"did":str_split_dataset_id, "val_split":val_split, "test_split":test_split};

    //alert(JSON.stringify(data));

    http_request.open("PUT", str_srv_url + "/dataset/split", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//获取所有导出模型
function load_models()
{
    update_nav_bar(Nav_Bar_Type_Enum["models"]);

    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.onreadystatechange=function()
    {
        if(http_request.readyState==4 && http_request.status==200)
        {
            //更新表格内容
            fill_table_contents(http_request.responseText, "models");
        }
        else
        {
            fill_table_with_error();
        }
    }
    http_request.open("GET",str_srv_url + "/model?type=exported",true);
    http_request.send(null);
}

//填充对象信息到表格(项目/数据集/任务/模型)
function fill_table_contents(list_contents, type = "project")
{
    if(type == "project")
    {
        document.getElementById("btn_refresh").value = "刷新项目信息";
        document.getElementById("table_create_new").style.display = "block";
        document.getElementById("btn_create_new").value = "新建项目";

        rows = table_contents.rows.length;
        for (i=0;i<rows;i++)
        {
            table_contents.deleteRow(i);
            rows=rows-1;
            i=i-1;
        }

        rows = table_contents.rows.length;
        var newTr=table_contents.insertRow(rows);
        var str_json = eval('(' + list_contents + ')');
        var obj_prjs = str_json["projects"];
        count_prj = Object.keys(obj_prjs).length;
        col_count = 1;

        //项目为空
        if(count_prj <= 0)
        {
            var newTd0=newTr.insertCell();
            var str_html = "<div id=\"draw-border\"><view_item id=\"btn_create\" onclick=\"show_download_demo_win_modal(this)\" style=\"width: 510px; height: 90px; align: center\">";
            str_html = str_html + "<br><font color=\"blue\">暂无项目，点击下载示例项目（或点击新建按纽创建新项目）</font>";

            str_html = str_html + "</view_item></div>";
            newTd0.innerHTML = str_html;
            return;
        }

        obj_prjs.sort(sort_compare('id'));
        for(var p in obj_prjs)
        {
            str_id = obj_prjs[p].id;
            str_attr = obj_prjs[p].attr;
            str_name = str_attr["name"];
            str_desc = str_attr["desc"];
            str_type = str_attr["type"];
            str_crttime = str_attr["create_time"];

            var newTd0=newTr.insertCell();
            var str_html = "";

            str_html = "<div id=\"draw-border\" style=\"word-wrap: break-word;\"><view_item onclick=\"show_project(this)\" oncontextmenu=\"javascript:show_project_popupmenu(this);\" id=\"" + str_id + "\">";
            //str_html = str_html + "<div class=\"hide_del_button\" id=\"" + str_id + "\" onclick=\"javascript:delete_project()\">删除</div>";

            str_html = str_html + "项目名称：" + str_name + " (" + str_id + ")" + "<br>" + "<input type=\"hidden\" id=\"view_project_name_" + str_id + "\" value=\"" + str_name + "\">";

            if(str_type == "classification")
                str_type_view = "<font color=\"green\">图像分类</font>";
            else if(str_type == "detection")
                str_type_view = "<font color=\"purple\">目标检测</font>";
            else if(str_type == "instance_segmentation")
                str_type_view = "<font color=\"orange\">实例分割</font>";
            else if(str_type == "segmentation")
                str_type_view = "<font color=\"red\">语义分割</font>";

            //如下所示，后续如果要获取对象数据，可以在此处放hidden input，后续再通过id获取
            str_html = str_html + "项目类型：" + str_type_view + "<br>" + "<input type=\"hidden\" id=\"view_project_type_" + str_id + "\" value=\"" + str_type + "\">";
            str_html = str_html + "项目描述：" + str_desc + "<br><br>";
            str_html = str_html + "创建时间：" + str_crttime + "<br>";
            str_html = str_html + "</view_item></div>";
            newTd0.innerHTML = str_html;

            if(col_count == 5)
            {
                rows = table_contents.rows.length;
                newTr=table_contents.insertRow(rows);
                col_count = 1;
            }
            else
            {
                col_count = col_count + 1;
            }
        }
    }
    else if(type == "dataset")
    {
        document.getElementById("btn_refresh").value = "刷新数据集信息";
        document.getElementById("table_create_new").style.display = "block";
        document.getElementById("btn_create_new").value = "新建数据集";

        rows = table_contents.rows.length;
        for (i=0;i<rows;i++)
        {
            table_contents.deleteRow(i);
            rows=rows-1;
            i=i-1;
        }

        rows = table_contents.rows.length;
        var newTr=table_contents.insertRow(rows);
        var str_json = eval('(' + list_contents + ')');
        var obj_datasets = str_json["datasets"];
        count_datasets = Object.keys(obj_datasets).length;
        col_count = 1;

        //数据集为空
        if(count_datasets <= 0)
        {
            var newTd0=newTr.insertCell();
            var str_html = "<div id=\"draw-border\"><view_item id=\"btn_create\" onclick=\"show_create_dataset_win_modal(this)\" style=\"width: 260px; height: 90px; align: center\">";
            str_html = str_html + "<br><font color=\"blue\">暂无数据集，点击创建数据集</font>";

            str_html = str_html + "</view_item></div>";
            newTd0.innerHTML = str_html;
            return;
        }

        obj_datasets.sort(sort_compare('id'));
        for(var p in obj_datasets)
        {
            str_id = obj_datasets[p].id;
            str_attr = obj_datasets[p].attr;
            str_name = str_attr["name"];
            str_desc = str_attr["desc"];
            str_type = str_attr["type"];
            str_crttime = str_attr["create_time"];
            str_status = str_attr["dataset_status"];
            str_dataset_path = str_attr["path"];

            //增加状态显示以及对应的操作
            var view_status_str = "未导入";
            var str_function = "void";
            if (str_status == DatasetStatus.XEMPTY)
            {
                view_status_str = "未导入";
                str_function = "show_import_dataset_win_modal";
            }
            else if (str_status == DatasetStatus.XCHECKING)
            {
                view_status_str = "校验中";
            }
            else if (str_status == DatasetStatus.XCHECKFAIL)
            {
                view_status_str = "校验失败";
                str_function = "show_import_dataset_win_modal";
            }
            else if (str_status == DatasetStatus.XCOPYING)
            {
                view_status_str = "导入中";
            }
            else if (str_status == DatasetStatus.XCOPYDONE)
            {
            	  view_status_str = "已校验&未切分";
            	  str_function = "show_split_dataset_win_modal";
            }
            else if (str_status == DatasetStatus.XSPLITED)
            {
                view_status_str = "已校验&已切分";
                str_function = "show_browse_dataset_win_modal";
            }
            else if (str_status == DatasetStatus.XCOPYFAIL)
            {
                view_status_str = "导入失败";
                str_function = "show_import_dataset_win_modal";
            }

	          var newTd0=newTr.insertCell();
            var str_html = "";

            str_html = "<div id=\"draw-border\" style=\"word-wrap: break-word;\"><view_item id=\"" + str_id + "\" onclick=\"javascript:" + str_function + "(this);\" oncontextmenu=\"javascript:show_dataset_popupmenu(this);\">";
            //str_html = str_html + "<div class=\"hide_del_button\" onclick=\"delete_dataset()\" id=\"" + str_id + "\">删除</div>";

            str_html = str_html + "数据集名称：" + str_name + " (" + str_id + ")" + "<br>" + "<input type=\"hidden\" id=\"view_dataset_name_" + str_id + "\" value=\"" + str_name + "\">";

            if(str_type == "classification")
            {
                str_dataset_type = "图像分类";
                str_type_view = "<font color=\"green\">图像分类</font>";
            }
            else if(str_type == "detection")
            {
                str_dataset_type = "目标检测";
                str_type_view = "<font color=\"purple\">目标检测</font>";
            }
            else if(str_type == "instance_segmentation")
            {
                str_dataset_type = "实例分割";
                str_type_view = "<font color=\"orange\">实例分割</font>";
            }
            else if(str_type == "segmentation")
            {
                str_dataset_type = "语义分割";
                str_type_view = "<font color=\"red\">语义分割</font>";
            }

            //如果需要获取对象信息，可以在此增加hidden的input
            str_html = str_html + "数据集类型：" + str_type_view + "<br>" + "<input type=\"hidden\" id=\"view_dataset_type_" + str_id + "\" value=\"" + str_dataset_type + "\">";
            str_html = str_html + "数据集描述：" + str_desc + "<br>" + "<input type=\"hidden\" id=\"view_dataset_desc_" + str_id + "\" value=\"" + str_desc + "\">";
            str_html = str_html + "创建时间：" + str_crttime + "<br>" + "<input type=\"hidden\" id=\"view_dataset_path_" + str_id + "\" value=\"" + str_dataset_path + "\">";

            str_html = str_html + "数据集状态：" + view_status_str + "<br>";
            str_html = str_html + "</view_item></div>";
            newTd0.innerHTML = str_html;

            if(col_count == 5)
            {
                rows = table_contents.rows.length;
                newTr=table_contents.insertRow(rows);
                col_count = 1;
            }
            else
            {
                col_count = col_count + 1;
            }
        }
    }
    else if(type == "task")
    {
        rows = table_contents.rows.length;
        for (i=0;i<rows;i++)
        {
            table_contents.deleteRow(i);
            rows=rows-1;
            i=i-1;
        }

        rows = table_contents.rows.length;
        var newTr=table_contents.insertRow(rows);
        var str_json = eval('(' + list_contents + ')');
        var obj_tasks = str_json["tasks"];
        count_tasks = Object.keys(obj_tasks).length;
        col_count = 1;

        //任务为空
        if(count_tasks <= 0)
        {
            var newTd0=newTr.insertCell();
            var str_html = "";

            if(document.getElementById("btn_refresh").value == "刷新项目任务信息")
            {
                str_html = "<div id=\"draw-border\"><view_item id=\"btn_create\" onclick=\"javascript:show_create_task_win_modal(this)\" style=\"width: 340px; height: 90px; align: center\">";
                str_html = str_html + "<br><font color=\"blue\">当前项目无训练任务，点击创建训练任务</font>";
                str_html = str_html + "</view_item></div>";
            }
            else
            {
                str_html = "<div id=\"draw-border\"><view_item id=\"btn_create\" onclick=\"javascript:void(this)\" style=\"width: 420px; height: 90px; align: center\">";
                str_html = str_html + "<br><font color=\"blue\">当前无训练任务，请先在对应项目中创建训练任务</font>";
                str_html = str_html + "</view_item></div>";
            }
            newTd0.innerHTML = str_html;
            return;
        }

        obj_tasks.sort(sort_compare('id'));
        for(var p in obj_tasks)
        {
            str_id = obj_tasks[p].id;
            str_pid = obj_tasks[p].pid;
            str_name = obj_tasks[p].name;
            str_desc = obj_tasks[p].desc;
            str_path = obj_tasks[p].path;
            str_crttime = obj_tasks[p].create_time;
            str_status = obj_tasks[p].status;
            str_type = obj_tasks[p].type;

            //增加状态显示以及对应的操作
            var view_status_str = "初始化";
            var str_function = "void";
            if (str_status == TaskStatus.XUNINIT)
            {
                view_status_str = "初始化";
                str_function = "show_init_task_win_modal";
            }
            else if (str_status == TaskStatus.XINIT)
            {
                view_status_str = "初始化";
                str_function = "show_init_task_win_modal";
            }
            else if (str_status == TaskStatus.XDOWNLOADING)
            {
                view_status_str = "下载预训练模型中";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XTRAINING)
            {
                view_status_str = "训练中";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XTRAINDONE)
            {
                view_status_str = "训练完成";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XEVALUATED)
            {
                view_status_str = "评估完成";
                str_function = "show_evaluate_export_win_modal";
            }
            else if (str_status == TaskStatus.XEXPORTING)
            {
                view_status_str = "模型导出中";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XEXPORTED)
            {
                view_status_str = "模型导出成功";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XTRAINEXIT)
            {
                view_status_str = "任务中止";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XDOWNLOADFAIL)
            {
                view_status_str = "预训练模型下载失败";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XTRAINFAIL)
            {
                view_status_str = "任务运行失败";
                str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XEVALUATING)
            {
                view_status_str = "任务评估中";
                str_function = "show_evaluate_export_win_modal";
            }
            else if (str_status == TaskStatus.XEVALUATEFAIL)
            {
                view_status_str = "评估失败";
                str_function = "show_evaluate_export_win_modal";
            }
            else if (str_status == TaskStatus.XEXPORTFAIL)
            {
                view_status_str = "模型导出失败";
                str_function = "show_evaluate_export_win_modal";
            }
            else if (str_status == TaskStatus.XPRUNEING)
            {
                view_status_str = "裁剪分析中";
                //str_function = "show_task_detail_info_win_modal";
            }
            else if (str_status == TaskStatus.XPRUNETRAIN)
            {
                view_status_str = "裁剪训练中";
                //str_function = "show_task_detail_info_win_modal";
            }

            var newTd0=newTr.insertCell();
            var str_html = "";

            str_html = "<div id=\"draw-border\" style=\"word-wrap: break-word;\"><view_item id=\"" + str_id + "\" onclick=\"javascript:" + str_function + "(this);\" oncontextmenu=\"javascript:show_task_popupmenu(this);\">";
            //str_html = str_html + "<div class=\"hide_del_button\" onclick=\"delete_task();\" id=\"" + str_id + "\">删除</div>";

            str_html = str_html + "任务ID：" + str_id + "<br>";

            if(str_type == "classification")
                str_type_view = "<font color=\"green\">图像分类</font>";
            else if(str_type == "detection")
                str_type_view = "<font color=\"purple\">目标检测</font>";
            else if(str_type == "instance_segmentation")
                str_type_view = "<font color=\"orange\">实例分割</font>";
            else if(str_type == "segmentation")
                str_type_view = "<font color=\"red\">语义分割</font>";

            //如果需要获取对象信息，可以在此增加hidden的input
            str_html = str_html + "任务类型：" + str_type_view + "<br>" + "<input type=\"hidden\" id=\"view_task_prj_type_" + str_id + "\" value=\"" + str_type + "\">";
            str_html = str_html + "所属项目：" + str_pid + "<br><br>" + "<input type=\"hidden\" id=\"view_task_pid_" + str_id + "\" value=\"" + str_pid + "\">";
            str_html = str_html + "创建时间：" + str_crttime + "<br>";

            str_html = str_html + "任务状态：" + view_status_str + "<br>";
            str_html = str_html + "</view_item></div>";
            newTd0.innerHTML = str_html;

            if(col_count == 5)
            {
                rows = table_contents.rows.length;
                newTr=table_contents.insertRow(rows);
                col_count = 1;
            }
            else
            {
                col_count = col_count + 1;
            }
        }
    }
    else if(type == "models")
    {
        document.getElementById("btn_refresh").value = "刷新模型信息";
        document.getElementById("table_create_new").style.display = "none";

        rows = table_contents.rows.length;
        for (i=0;i<rows;i++)
        {
            table_contents.deleteRow(i);
            rows=rows-1;
            i=i-1;
        }

        rows = table_contents.rows.length;
        var newTr=table_contents.insertRow(rows);
        var str_json = eval('(' + list_contents + ')');
        var obj_models = str_json["exported_models"];
        count_models = Object.keys(obj_models).length;
        col_count = 1;

        //模型为空
        if(count_models <= 0)
        {
            var newTd0=newTr.insertCell();
            var str_html = "<div id=\"draw-border\"><view_item id=\"btn_create\" onclick=\"javascript:void(this)\" style=\"width: 350px; height: 90px; align: center\">"
            str_html = str_html + "<br><font color=\"blue\">暂无模型，请先启动任务训练并导出模型</font>";

            str_html = str_html + "</view_item></div>";
            newTd0.innerHTML = str_html;
            return;
        }

        obj_models.sort(sort_compare('id'));
        for(var p in obj_models)
        {
            str_id = obj_models[p].id;
            var str_model_name = obj_models[p].name;
            var str_model_view_type = "图像分类";
            var str_model_path = obj_models[p].path;
            var str_model = obj_models[p].model;
            var str_model_crttime = obj_models[p].create_time;
            var str_model_type = obj_models[p].type;
            var str_model_pid = obj_models[p].pid;
            var str_model_tid = obj_models[p].tid;

            var newTd0=newTr.insertCell();
            var str_html = "";

            if(str_model_type == "classification")
                str_model_view_type = "<font color=\"green\">图像分类</font>";
            else if(str_model_type == "detection")
                str_model_view_type = "<font color=\"purple\">目标检测</font>";
            else if(str_model_type == "instance_segmentation")
                str_model_view_type = "<font color=\"orange\">实例分割</font>";
            else if(str_model_type == "segmentation")
                str_model_view_type = "<font color=\"red\">语义分割</font>";

            var str_function = "show_model_test_predict_win_modal";

            str_html = "<div id=\"draw-border\" style=\"word-wrap: break-word;\"><view_item id=\"" + str_id + "\" style=\"width: 750px;height: 170px;\" onclick=\"javascript:" + str_function + "(this);\" oncontextmenu=\"javascript:show_models_popupmenu(this);\">";
            //str_html = str_html + "<div class=\"hide_del_button\" onclick=\"delete_model()\" id=\"" + str_id + "\">删除</div>";
            str_html = str_html + "模型名称：" + str_model_name + " (" + str_id + ")" + "<br>" + "<input type=\"hidden\" id=\"view_model_detail_name_" + str_id + "\" value=\"" + str_model_name + "\">";
            str_html = str_html + "模型类型：" + str_model_view_type + "<br>" + "<input type=\"hidden\" id=\"view_model_detail_type_" + str_id + "\" value=\"" + str_model_type + "\">";
            str_html = str_html + "网络结构：" + str_model + "<br>" + "<input type=\"hidden\" id=\"view_model_detail_net_" + str_id + "\" value=\"" + str_model + "\">" ;
            str_html = str_html + "所属项目及任务：" + str_model_pid + "-" + str_model_tid + "<br>" + "<input type=\"hidden\" id=\"view_model_detail_tid_" + str_id + "\" value=\"" + str_model_tid + "\">";

            //如果需要获取对象信息，可以在此增加hidden的input
            str_html = str_html + "模型路径： <font size=\"1\">" + str_model_path + "</font><br>" + "<input type=\"hidden\" id=\"view_model_detail_path_" + str_id + "\" value=\"" + str_model_path + "\">"  ;
            str_html = str_html + "导出时间：" + str_model_crttime + "<br>" + "<input type=\"hidden\" id=\"view_model_detail_pid_" + str_id + "\" value=\"" + str_model_pid + "\">";

            str_html = str_html + "</view_item></div>";
            newTd0.innerHTML = str_html;

            if(col_count == 2)
            {
                rows = table_contents.rows.length;
                newTr=table_contents.insertRow(rows);
                col_count = 1;
            }
            else
            {
                col_count = col_count + 1;
            }
        }
    }
}

//错误信息提示
function fill_table_with_error()
{
    rows = table_contents.rows.length;
    for (i=0;i<rows;i++)
    {
        table_contents.deleteRow(i);
        rows=rows-1;
        i=i-1;
    }

    rows = table_contents.rows.length;
    var newTr=table_contents.insertRow(rows);

    var newTd0=newTr.insertCell();
    var str_html = "<div id=\"draw-border\"><view_item id=\"btn_create\" onclick=\"show_server_info(this)\" style=\"width: 330px; height: 90px; align: center\">"
    str_html = str_html + "<br><font color=\"red\">连接服务器失败，点击设置服务器信息</font>";

    str_html = str_html + "</view_item></div>";
    newTd0.innerHTML = str_html;
}

//显示创建任务弹出窗口
function show_create_task_win_modal(obj)
{
    var obj_project_id = document.getElementById('popup_menu_project_id');
    var str_project_id = "";

    //清除原来保存的id
    document.getElementById('create_task_hidden_task_id').value = "";

    if(obj_project_id.value != "")
    {
        var input_create_task_prj_id = document.getElementById('create_task_project_id');
        input_create_task_prj_id.value = obj_project_id.value;
        str_project_id = obj_project_id.value;
    }
    else
    {
        var input_create_task_prj_id = document.getElementById('create_task_project_id');
        input_create_task_prj_id.value = g_view_project_task_id;
        str_project_id = g_view_project_task_id;
    }

    //创建任务时项目类型
    var str_task_type = "";
    try
    {
        str_task_type = document.getElementById("view_project_type_" + str_project_id).value;
    }
    catch(err)
    {
        str_task_type = g_view_project_task_type;
    }

    //取出默认参数
    var http_request = new XMLHttpRequest();
    http_request.open("GET", str_srv_url + "/project/task/params?pid=" + str_project_id, false);
    http_request.send(null);

    //填充参数到表格
    add_parms_to_table(http_request.responseText, str_task_type);

    //按纽
    var obj_btn = document.getElementById('btn_create_task');
    obj_btn.value = "创建并启动训练";

    var on_win_create_task = document.getElementById('input_win_create_task');
    var over_win_create_task = document.getElementById('input_win_create_task_over');

    on_win_create_task.style.display = "block";
    over_win_create_task.style.display = "block";
}

//隐藏创建任务弹出窗口
function hide_create_task_win_modal(obj)
{
    var on_win_create_task = document.getElementById('input_win_create_task');
    var over_win_create_task = document.getElementById('input_win_create_task_over');
    var input_create_task_prj_id = document.getElementById('create_task_project_id');

    //清除原来保存的id
    document.getElementById('create_task_hidden_task_id').value = "";

    on_win_create_task.style.display = "none";
    over_win_create_task.style.display = "none";
    input_create_task_prj_id.value = "";
}

//显示任务初始化参数及启动训练弹窗
function show_init_task_win_modal(obj)
{
    var str_view_task_id = obj.id;
    var str_obj_task_prj_key = "view_task_pid_" + obj.id;
    var obj_project_id = document.getElementById(str_obj_task_prj_key);
    var str_project_id = obj_project_id.value;

    //任务类型
    var str_task_type = document.getElementById("view_task_prj_type_" + str_view_task_id).value;

    //取出默认参数
    var http_request = new XMLHttpRequest();
    http_request.open("GET", str_srv_url + "/project/task/params?tid=" + str_view_task_id, false);
    http_request.send(null);

    //填充参数到表格
    add_parms_to_table(http_request.responseText, str_task_type);

    //tid赋值成obj.id
    var obj_init_task_input = document.getElementById('create_task_hidden_task_id');
    obj_init_task_input.value = obj.id;

    var obj_btn = document.getElementById('btn_create_task');
    obj_btn.value = "启动训练";

    var on_win_create_task = document.getElementById('input_win_create_task');
    var over_win_create_task = document.getElementById('input_win_create_task_over');

    on_win_create_task.style.display = "block";
    over_win_create_task.style.display = "block";
}

//增加所有参数到表格
function add_parms_to_table(str_parms, str_type = "classification")
{
    var obj_json = eval('(' + str_parms + ')');
    var obj_parms = obj_json["train"];
    g_train_task_parms = obj_parms;

    var rows = table_create_task.rows.length;
    for (i=0;i<rows;i++)
    {
        table_create_task.deleteRow(i);
        rows=rows-1;
        i=i-1;
    }

    //根据模型类型增加参数
    var tr_bg_color_gen = "#D4FB79";
    var tr_bg_color_adv = "#FFFC79";
    var tr_bg_color_aug = "#76D6FF";
    var rows = table_create_task.rows.length;
    var newTr = table_create_task.insertRow(rows);
    newTr.className = "parent_parm_row";
    newTr.id = "general_parm_row";
    newTr.onclick=function()
    {
        for (i=0; i < table_create_task.rows.length; i++)
        {
            var obj_tr = table_create_task.rows[i];
            if(obj_tr.className == "child_" + this.id)
            {
                if(obj_tr.style.display == "none")
                    obj_tr.style.display = "table-row";
                else
                    obj_tr.style.display = "none";
            }
        }
    }
    newTr.style.cursor="pointer";
    newTr.style.backgroundColor = tr_bg_color_gen;
    var newTd0=newTr.insertCell();
    newTd0.colSpan="2";
    newTd0.innerText="通用参数";

    //通用参数
    add_one_task_parm_to_table("model", "模型选择", g_train_task_parms["model"], newTr.id, "selection",str_type);

    //骨干网络
    if (g_train_task_parms.hasOwnProperty("backbone"))
    {
        add_one_task_parm_to_table("backbone", "骨干网络", g_train_task_parms["backbone"], newTr.id, "selection",str_type);
    }
    else
    {
        add_one_task_parm_to_table("backbone", "骨干网络", "", newTr.id, "selection",str_type);
    }

    add_one_task_parm_to_table("pretrain_weights", "预训练模型", g_train_task_parms["pretrain_weights"], newTr.id, "selection");
    add_one_task_parm_to_table("image_shape", "图像大小", g_train_task_parms["image_shape"], newTr.id);

    add_one_task_parm_to_table("num_epochs", "迭代轮数", g_train_task_parms["num_epochs"], newTr.id);
    add_one_task_parm_to_table("learning_rate", "学习率", g_train_task_parms["learning_rate"], newTr.id);
    add_one_task_parm_to_table("batch_size", "批大小", g_train_task_parms["batch_size"], newTr.id);

    //获取系统信息用于GPU信息选择
    var str_sys_info = get_server_system_info();

    var obj_json = eval('(' + str_sys_info + ')');
    var int_gpu_count = parseInt(obj_json["info"]["gpu_num"]);
    var int_cpu_count = parseInt(obj_json["info"]["cpu_num"]);
    var str_sys_platform = obj_json["info"]["sysstr"];

    if(int_gpu_count > 0)
    {
        add_one_task_parm_to_table("use_gpu", "是否使用GPU", "yes", newTr.id, "enable");
        if(str_sys_platform.toLowerCase() == "linux");
        {
            var str_gpu_card_num = "0";
            for (i=1; i < int_gpu_count; i++)
            {
                str_gpu_card_num = str_gpu_card_num + "," + i;
            }
            if (g_train_task_parms.hasOwnProperty("cuda_visible_devices") && g_train_task_parms["cuda_visible_devices"].length > 0)
            {
                str_gpu_card_num = g_train_task_parms["cuda_visible_devices"];
            }
            add_one_task_parm_to_table("cuda_visible_devices", "训练使用GPU卡列表", str_gpu_card_num, newTr.id, "text");
        }
    }
    else
    {
        add_one_task_parm_to_table("use_gpu", "是否使用GPU", "否(未检测到GPU)", newTr.id, "label");
    }

    //高级参数
    var rows = table_create_task.rows.length;
    var newTr = table_create_task.insertRow(rows);
    newTr.className = "parent_parm_row";
    newTr.id = "advance_parm_row";
    newTr.onclick=function()
    {
        for (i=0; i < table_create_task.rows.length; i++)
        {
            var obj_tr = table_create_task.rows[i];
            if(obj_tr.className == "child_" + this.id)
            {
                if(obj_tr.style.display == "none")
                    obj_tr.style.display = "table-row";
                else
                    obj_tr.style.display = "none";
            }
        }
    }
    newTr.style.cursor="pointer";
    newTr.style.backgroundColor = tr_bg_color_adv;
    var newTd0=newTr.insertCell();
    newTd0.colSpan="2";
    newTd0.innerText="高级参数";

    add_one_task_parm_to_table("save_interval_epochs", "模型保存轮数", g_train_task_parms["save_interval_epochs"], newTr.id);
    add_one_task_parm_to_table("lr_policy", "学习率下降方法", g_train_task_parms["lr_policy"], newTr.id, "selection");
    add_one_task_parm_to_table("lr_decay_epochs", "学习率刷哀减轮数", g_train_task_parms["lr_decay_epochs"], newTr.id);

    add_one_task_parm_to_table("image_mean", "图像均值", g_train_task_parms["image_mean"], newTr.id);
    add_one_task_parm_to_table("image_std", "图像方差", g_train_task_parms["image_std"], newTr.id);

    //数据增强策略
    var rows = table_create_task.rows.length;
    var newTr = table_create_task.insertRow(rows);
    newTr.className = "parent_parm_row";
    newTr.id = "augument_parm_row";
    newTr.onclick=function()
    {
        for (i=0; i < table_create_task.rows.length; i++)
        {
            var obj_tr = table_create_task.rows[i];
            if(obj_tr.className == "child_" + this.id)
            {
                if(obj_tr.style.display == "none")
                    obj_tr.style.display = "table-row";
                else
                    obj_tr.style.display = "none";
            }
        }
    }
    newTr.style.cursor="pointer";
    newTr.style.backgroundColor = tr_bg_color_aug;
    var newTd0=newTr.insertCell();
    newTd0.colSpan="2";
    newTd0.innerText="数据增强策略";

    add_one_task_parm_to_table("brightness", "随机亮度", g_train_task_parms["brightness"], newTr.id, "switch");
    add_one_task_parm_to_table("contrast", "随机对比度", g_train_task_parms["contrast"], newTr.id, "switch");
    add_one_task_parm_to_table("horizontal_flip", "随机水平翻转", g_train_task_parms["horizontal_flip"], newTr.id, "switch");
    add_one_task_parm_to_table("vertical_flip", "随机垂直翻转", g_train_task_parms["vertical_flip"], newTr.id, "switch");
    add_one_task_parm_to_table("rotate", "随机旋转", g_train_task_parms["rotate"], newTr.id, "switch");
    add_one_task_parm_to_table("saturation", "随机饱和度", g_train_task_parms["saturation"], newTr.id, "switch");
    add_one_task_parm_to_table("hue", "随机色调", g_train_task_parms["hue"], newTr.id, "switch");

    add_one_task_parm_to_table("augument_details", "数据增强详细设置", "点击设置...", newTr.id, "button");
}

//增加一个训练参数到表格(text/select/enable/switch)
function add_one_task_parm_to_table(str_key, str_view, str_value, parent_key = "", parm_type = "text", task_type = "classification")
{
    var rows = table_create_task.rows.length;
    var bg_color = "background-color:#ffffff;"
    if(rows % 2 == 0)
    {
        bg_color = "background-color:#f2f2f2;"
    }
    var newTr = table_create_task.insertRow(rows);
    if(parent_key != "")
    {
        newTr.className = "child_" + parent_key;
        newTr.id = "task_parms_" + str_key;
    }

    var newTd0=newTr.insertCell();
    var newTd1=newTr.insertCell();
    newTd0.innerHTML = str_view;
    if(parm_type == "text")
    {
        newTd1.innerHTML = "<input id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\" type=\"text\"/>";
    }
    else if (parm_type == "label")
    {
        newTd1.innerHTML = "<input id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\" type=\"text\" readonly=\"readonly\"/>";
    }
    else if (parm_type == "button")
    {
        var str_function = "void";
        if(str_key == "augument_details")
        {
            str_function = "show_augument_detail_parms";
        }
        newTd1.innerHTML = "<input type=\"button\" onclick=\"" + str_function + "(this)\" id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\"/>";
    }
    else if (parm_type == "selection")
    {
        if(str_key == "model")
        {
            //任务类型
            var str_list = Model_List[task_type];
            var str_html = "<select id=\"task_detail_parm_" + str_key + "\" onchange=\"change_model_type(this);\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\">";
            for(var i=0;i<str_list.length;i++)
            {
                if(str_value ==  str_list[i])
                    str_html = str_html + "<option value=\"" + str_list[i] + "\" selected=\"selected\">" + str_list[i] + "</option>";
                else
                    str_html = str_html + "<option value=\"" + str_list[i] + "\">" + str_list[i] + "</option>";
            }
            str_html = str_html + "</select>";
            newTd1.innerHTML = str_html;
        }
        else if (str_key == "backbone")
        {
            //骨干网络
            var lst_backbones = ["NA"];
            if(str_value != "")
            {
                lst_backbones = Backbone_List[document.getElementById('task_detail_parm_model').value];
            }
            var str_html = "<select id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\">";
            for(var i=0;i<lst_backbones.length;i++)
            {
                if(str_value ==  lst_backbones[i])
                    str_html = str_html + "<option value=\"" + lst_backbones[i] + "\" selected=\"selected\">" + lst_backbones[i] + "</option>";
                else
                    str_html = str_html + "<option value=\"" + lst_backbones[i] + "\">" + lst_backbones[i] + "</option>";
            }
            str_html = str_html + "</select>";
            newTd1.innerHTML = str_html;
        }
        else if (str_key == "pretrain_weights")
        {
            //预训练模型
            var lst_pretrain_weights = get_pretrained_model_list("");
            var str_html = "<select id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\">";
            for(var i=0;i<lst_pretrain_weights.length;i++)
            {
                if(str_value ==  lst_pretrain_weights[i])
                    str_html = str_html + "<option value=\"" + lst_pretrain_weights[i] + "\" selected=\"selected\">" + lst_pretrain_weights[i] + "</option>";
                else
                    str_html = str_html + "<option value=\"" + lst_pretrain_weights[i] + "\">" + lst_pretrain_weights[i] + "</option>";
            }
            str_html = str_html + "</select>";
            newTd1.innerHTML = str_html;
        }
        else if (str_key == "lr_policy")
        {
            //学习率哀减策略
            var lst_lr_policy = get_lr_decay_list("");
            var str_html = "<select id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\">";
            for(var i=0;i<lst_lr_policy.length;i++)
            {
                if(str_value ==  lst_lr_policy[i])
                    str_html = str_html + "<option value=\"" + lst_lr_policy[i] + "\" selected=\"selected\">" + lst_lr_policy[i] + "</option>";
                else
                    str_html = str_html + "<option value=\"" + lst_lr_policy[i] + "\">" + lst_lr_policy[i] + "</option>";
            }
            str_html = str_html + "</select>";
           newTd1.innerHTML = str_html;
        }
    }
    else if (parm_type == "enable")
    {
        var str_html = "<select id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\">";
        if(str_value == "yes")
            str_html = str_html + "<option value=\"" + "yes" + "\" selected=\"selected\">" + "是" + "</option>";
        else
            str_html = str_html + "<option value=\"" + "yes" + "\">" + "是" + "</option>";

        if(str_value == "no")
            str_html = str_html + "<option value=\"" + "no" + "\" selected=\"selected\">" + "否" + "</option>";
        else
            str_html = str_html + "<option value=\"" + "no" + "\">" + "否" + "</option>";
        str_html = str_html + "</select>";
        newTd1.innerHTML = str_html;
    }
    else if (parm_type == "switch")
    {
        var str_html = "<select id=\"task_detail_parm_" + str_key + "\" value=\"" + str_value + "\"" + "style=\"width:100%;height:20px;Float:left;border:none;outline:none;" + bg_color + "\">";
        if(str_value == "on" || str_value == true)
            str_html = str_html + "<option value=\"" + "on" + "\" selected=\"selected\">" + "开" + "</option>";
        else
            str_html = str_html + "<option value=\"" + "on" + "\">" + "开" + "</option>";

        if(str_value == "off" || str_value == false)
            str_html = str_html + "<option value=\"" + "off" + "\" selected=\"selected\">" + "关" + "</option>";
        else
            str_html = str_html + "<option value=\"" + "off" + "\">" + "关" + "</option>";
        str_html = str_html + "</select>";
        newTd1.innerHTML = str_html;
    }
}

//设置数据增强详细信息
function show_augument_detail_parms(obj)
{
    load_data_augument_parms();

    document.getElementById('win_data_augmentation_detail').style.display = "block";
    document.getElementById('win_data_augmentation_detail_over').style.display = "block";
}

//关闭数据增强窗口
function hide_augument_detail_parms(obj)
{
    document.getElementById('win_data_augmentation_detail').style.display = "none";
    document.getElementById('win_data_augmentation_detail_over').style.display = "none";
}

//保存数据增强参数
function save_augument_detail_parms(obj)
{
    var str_task_id = document.getElementById('create_task_hidden_task_id').value;

    set_data_augument_parms(str_task_id);

    hide_augument_detail_parms(obj);
}

//Demo案例下载窗口
function show_download_demo_win_modal()
{
    document.getElementById('download_cls_label').disabled = false;
    document.getElementById('download_det_label').disabled = false;
    document.getElementById('download_ins_label').disabled = false;
    document.getElementById('download_seg_label').disabled = false;

    document.getElementById('download_cls_label').checked = false;
    document.getElementById('download_det_label').checked = false;
    document.getElementById('download_ins_label').checked = false;
    document.getElementById('download_seg_label').checked = false;

    document.getElementById('cls_download_status_progress_bar_value').style = "width: 0%;";
    document.getElementById('cls_download_status_progress_bar').innerText = "0%";
    document.getElementById('det_download_status_progress_bar_value').style = "width: 0%;";
    document.getElementById('det_download_status_progress_bar').innerText = "0%";
    document.getElementById('ins_download_status_progress_bar_value').style = "width: 0%;";
    document.getElementById('ins_download_status_progress_bar').innerText = "0%";
    document.getElementById('seg_download_status_progress_bar_value').style = "width: 0%;";
    document.getElementById('seg_download_status_progress_bar').innerText = "0%";

    document.getElementById('btn_download_proc').style.background = "#0000cd";
    document.getElementById('btn_download_proc').value = "开始下载";

    var on_win_download_demo = document.getElementById('demo_download_win');
    var over_win_download_demo = document.getElementById('demo_download_win_over');

    on_win_download_demo.style.display = "block";
    over_win_download_demo.style.display = "block";
}

//关闭下载窗口
function hide_download_demo_win_modal()
{
    //关闭定时器
    g_instance_download_demo_clock=window.clearInterval(g_instance_download_demo_clock);

    var on_win_download_demo = document.getElementById('demo_download_win');
    var over_win_download_demo = document.getElementById('demo_download_win_over');

    on_win_download_demo.style.display = "none";
    over_win_download_demo.style.display = "none";
}

//下载相关操作
function download_win_btn_proc(obj)
{
    var str_btn_txt = obj.value;
    if(str_btn_txt == "开始下载" || str_btn_txt == "重新下载")
    {
        if (document.getElementById('download_cls_label').checked == false && document.getElementById('download_det_label').checked == false
            && document.getElementById('download_ins_label').checked == false && document.getElementById('download_seg_label').checked == false)
        {
            alert("请至少选择一个示例项目!");
            return;
        }

        document.getElementById('download_cls_label').disabled = true;
        document.getElementById('download_det_label').disabled = true;
        document.getElementById('download_ins_label').disabled = true;
        document.getElementById('download_seg_label').disabled = true;

        //启动下载任务
        start_download_demo(obj);
        //启动定时器
        g_instance_download_demo_clock = self.setInterval("refresh_download_progress()",2000);

        document.getElementById('btn_download_proc').style.background = "#FF2600";
        document.getElementById('btn_download_proc').value = "停止下载";
    }
    else if(str_btn_txt == "停止下载")
    {
        document.getElementById('download_cls_label').disabled = false;
        document.getElementById('download_det_label').disabled = false;
        document.getElementById('download_ins_label').disabled = false;
        document.getElementById('download_seg_label').disabled = false;
        //停止任务
        stop_download_demo(obj);
        //停止定时器
        g_instance_download_demo_clock=window.clearInterval(g_instance_download_demo_clock);

        document.getElementById('btn_download_proc').style.background = "#0000cd";
        document.getElementById('btn_download_proc').value = "开始下载";
    }
}

//下载示例项目
function start_download_demo(obj)
{
    //下载项目
    if (document.getElementById('download_cls_label').checked == true)
    {
        download_one_project("classification");
    }
    if (document.getElementById('download_det_label').checked == true)
    {
        download_one_project("detection");
    }
    if (document.getElementById('download_ins_label').checked == true)
    {
        download_one_project("instance_segmentation");
    }
    if (document.getElementById('download_seg_label').checked == true)
    {
        download_one_project("segmentation");
    }
}

//下载一个示例工程
function download_one_project(prj_type = "classification")
{
    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status!=200)
            {
                 alert("下载" + prj_type + "示例项目失败，请检查服务器配置!\n" + http_request.responseText);
            }
        }
    }
    var data = {"type":"download","prj_type":prj_type};
    http_request.open("POST", str_srv_url + "/demo", false);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//停止下载demo
function stop_download_demo(obj)
{
    if (document.getElementById('download_cls_label').checked == true)
    {
        stop_download_one_project("classification");
    }
    if (document.getElementById('download_det_label').checked == true)
    {
        stop_download_one_project("detection");
    }
    if (document.getElementById('download_ins_label').checked == true)
    {
        stop_download_one_project("instance_segmentation");
    }
    if (document.getElementById('download_seg_label').checked == true)
    {
        stop_download_one_project("segmentation");
    }
}

//停止正在下载的项目
function stop_download_one_project(prj_type = "classification")
{
    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status!=200)
            {
                 //alert("停止" + prj_type + "示例项目失败，请检查服务器配置!\n" + http_request.responseText);
            }
        }
    }
    var data = {"prj_type":prj_type};

    http_request.open("PUT", str_srv_url + "/demo", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//刷新下载进度
function refresh_download_progress()
{
    //获取下载进度，刷新下载任务窗口
    var int_progress = 0;
    var b_finish = true;
    if (document.getElementById('download_cls_label').checked == true)
    {
        var dic_status = get_one_project_download_status("classification");
        int_progress = dic_status.progress;
        //进度条
        var obj_view_cls_download_status_progress_value = document.getElementById('cls_download_status_progress_bar_value');
        obj_view_cls_download_status_progress_value.style = "width: " + int_progress + "%;";
        var obj_view_cls_download_status_progress_bar = document.getElementById('cls_download_status_progress_bar');
        obj_view_cls_download_status_progress_bar.innerText = int_progress + "%";

        if(int_progress < 100)
        {
            b_finish = false;
        }
    }
    if (document.getElementById('download_det_label').checked == true)
    {
        var dic_status = get_one_project_download_status("detection");
        int_progress = dic_status.progress;

        //进度条
        var obj_view_det_download_status_progress_value = document.getElementById('det_download_status_progress_bar_value');
        obj_view_det_download_status_progress_value.style = "width: " + int_progress + "%;";
        var obj_view_det_download_status_progress_bar = document.getElementById('det_download_status_progress_bar');
        obj_view_det_download_status_progress_bar.innerText = int_progress + "%";

        if(int_progress < 100)
        {
            b_finish = false;
        }
    }
    if (document.getElementById('download_ins_label').checked == true)
    {
        var dic_status = get_one_project_download_status("instance_segmentation");
        int_progress = dic_status.progress;
        //进度条
        var obj_view_ins_download_status_progress_value = document.getElementById('ins_download_status_progress_bar_value');
        obj_view_ins_download_status_progress_value.style = "width: " + int_progress + "%;";
        var obj_view_ins_download_status_progress_bar = document.getElementById('ins_download_status_progress_bar');
        obj_view_ins_download_status_progress_bar.innerText = int_progress + "%";

        if(int_progress < 100)
        {
            b_finish = false;
        }
    }
    if (document.getElementById('download_seg_label').checked == true)
    {
        var dic_status = get_one_project_download_status("segmentation");
        int_progress = dic_status.progress;
        //进度条
        var obj_view_seg_download_status_progress_value = document.getElementById('seg_download_status_progress_bar_value');
        obj_view_seg_download_status_progress_value.style = "width: " + int_progress + "%;";
        var obj_view_seg_download_status_progress_bar = document.getElementById('seg_download_status_progress_bar');
        obj_view_seg_download_status_progress_bar.innerText = int_progress + "%";

        if(int_progress < 100)
        {
            b_finish = false;
        }
    }

    if(b_finish == true)
    {
        g_instance_download_demo_clock=window.clearInterval(g_instance_download_demo_clock);
        //创建对应项目
        alert("示例工程下载完成！即将创建对应工程，请稍候...");

        create_demo_project();

        document.getElementById('download_cls_label').disabled = false;
        document.getElementById('download_det_label').disabled = false;
        document.getElementById('download_ins_label').disabled = false;
        document.getElementById('download_seg_label').disabled = false;

        document.getElementById('btn_download_proc').style.background = "#0000cd";
        document.getElementById('btn_download_proc').value = "重新下载";

        alert("示例工程创建完成！");

        load_projects();
    }
}

//创建示例项目
function create_demo_project()
{
    if (document.getElementById('download_cls_label').checked == true)
    {
        create_one_demo_project("classification");
    }
    if (document.getElementById('download_det_label').checked == true)
    {
        create_one_demo_project("detection");
    }
    if (document.getElementById('download_ins_label').checked == true)
    {
        create_one_demo_project("instance_segmentation");
    }
    if (document.getElementById('download_seg_label').checked == true)
    {
        create_one_demo_project("segmentation");
    }
}

//创建一个示例工程
function create_one_demo_project(prj_type = "classification")
{
    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status!=200)
            {
                 alert("创建" + prj_type + "示例项目失败，请检查服务器配置!\n" + http_request.responseText);
            }
        }
    }

    var data = {"type":"load","prj_type":prj_type};
    http_request.open("POST", str_srv_url + "/demo", false);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//获取一个项目的下载进度
function get_one_project_download_status(prj_type = "classification")
{
    var http_request = new XMLHttpRequest();
    http_request.open("GET", str_srv_url + "/demo?prj_type=" + prj_type, false)
    http_request.send(null);

    var obj_json = eval('(' + http_request.responseText + ')');
    var str_download_status = obj_json["attr"]["status"];
    var int_progress = 0;
    if(obj_json["attr"]["progress"] != "")
    {
        int_progress = parseInt(obj_json["attr"]["progress"]);;
    }

    if(str_download_status == DownloadStatus.XDDOWNLOADFAIL)
    {
        int_progress = 0;
    }
    else if(str_download_status == DownloadStatus.XDDOWNLOADING)
    {
        if(int_progress > 50)
        {
            int_progress = 50;
        }
    }
    else if(str_download_status == DownloadStatus.XDDOWNLOADDONE)
    {
        int_progress = 50;
    }
    else if(str_download_status == DownloadStatus.XDDECOMPRESSED)
    {
        int_progress = 100;
    }

    return {status:str_download_status, progress:int_progress};
}

//设置->下载示例项目
function download_demo_btn_proc(obj)
{
    show_download_demo_win_modal();
    hide_server_info(obj);
}

//预训练模型列表
function get_pretrained_model_list(str_model_name)
{
    var lst_pretrained_model = ["IMAGENET","不使用预训练模型"];

    return lst_pretrained_model;
}

//学习率哀减策略列表
function get_lr_decay_list(str_model_name)
{
    var lst_lr_decay = ["Linear","Piecewise","Cosine"];
    return lst_lr_decay;
}

//创建并启动任务训练
function create_task()
{
    var input_create_task_prj_id = document.getElementById('create_task_project_id');
    var str_project_id = input_create_task_prj_id.value;

    var obj_btn = document.getElementById('btn_create_task');
    if(obj_btn.value == "启动训练")
    {
        var str_start_tid = ""
        var obj_init_task_input = document.getElementById('create_task_hidden_task_id');
        str_start_tid = obj_init_task_input.value;

        start_task(str_start_tid);

        if (document.getElementById('btn_refresh').value == "刷新项目任务信息")
        {
            load_project_tasks(g_view_project_task_id);
        }
        else
        {
            load_tasks();
        }

        hide_create_task_win_modal(null);
    }
    else if(obj_btn.value == "创建并启动训练")
    {
        var http_request = new XMLHttpRequest();
        http_request.onreadystatechange=function()
        {
             if (http_request.readyState==4)
            {
                if (http_request.status==200)
                {
                     alert("任务创建成功!\n" +  http_request.responseText);

                     //调用训练接口启动任务训练
                     str_json = http_request.responseText;
                     var obj_json = eval('(' + str_json + ')');
                     var str_new_tid = obj_json["tid"];

                     start_task(str_new_tid);

                     if (document.getElementById('btn_refresh').value == "刷新项目任务信息")
                     {
                         load_project_tasks(g_view_project_task_id);
                     }
                     else
                     {
                         load_tasks();
                     }

                     hide_create_task_win_modal(null);
                }
                else
                {
                     alert("任务创建失败，请检查服务器配置" + http_request.responseText);
                }
            }
         }

         //获取训练参数
         get_input_task_parm_value("model","text");
         get_input_task_parm_value("backbone","text");

         get_input_task_parm_value("num_epochs","int");
         get_input_task_parm_value("batch_size","int");
         get_input_task_parm_value("learning_rate","float");

         get_input_task_parm_value("save_interval_epochs","int");

         //图像参数
         get_input_task_parm_value("image_shape","list");
         get_input_task_parm_value("image_mean","list");
         get_input_task_parm_value("image_std","list");

         //是否使用GPU
         get_input_task_parm_value("use_gpu","text");

         //数据增强开关
         get_input_task_parm_value("brightness","bool");
         get_input_task_parm_value("contrast","bool");
         get_input_task_parm_value("saturation","bool");
         get_input_task_parm_value("rotate","bool");
         get_input_task_parm_value("hue","bool");
         get_input_task_parm_value("vertical_flip","bool");
         get_input_task_parm_value("horizontal_flip","bool");

         //调用创建接口创建任务
         //alert(JSON.stringify(g_train_task_parms));
         var data = {"pid":str_project_id,"train":JSON.stringify(g_train_task_parms)};

         http_request.open("POST", str_srv_url + "/project/task", true);
         http_request.setRequestHeader("Content-type","application/json");
         http_request.send(JSON.stringify(data));
    }
}

//获取表格中模型训练参数
function get_input_task_parm_value(str_key, str_type="int")
{
    var str_input_obj_key = "task_detail_parm_" + str_key;
    var obj_task_parm_input = document.getElementById(str_input_obj_key);
    var str_value = obj_task_parm_input.value;

    if(str_type == "int")
    {
        g_train_task_parms[str_key] = parseInt(str_value);
    }
    else if (str_type == "float")
    {
        g_train_task_parms[str_key] = parseFloat(str_value);
    }
    else if (str_type == "list")
    {
        g_train_task_parms[str_key] = str_value.split(',').map(Number);
    }
    else if (str_type == "bool")
    {
        if(str_value == "on")
        {
            g_train_task_parms[str_key] = true;
        }
        else
        {
            g_train_task_parms[str_key] = false;
        }
    }
    else
    {
        if(str_key == "backbone" && str_value == "NA")
        {
            g_train_task_parms[str_key] = "";
            return;
        }
        if(str_key == "use_gpu")
        {
            if(str_value == "yes")
            {
                g_train_task_parms["use_gpu"] = true;
                var str_card_list = document.getElementById('task_detail_parm_cuda_visible_devices').value
                g_train_task_parms["cuda_visible_devices"] = str_card_list;
                //g_train_task_parms["cuda_visible_devices"] = str_card_list.split(',').map(Number);
                return;
            }
            else
            {
                return;
            }
        }
        g_train_task_parms[str_key] = str_value;
    }
}

//保存数据增强设置
function set_data_augument_parms(str_task_id)
{
    g_train_task_parms["brightness_prob"] = document.getElementById('brightness_prob').value;
    g_train_task_parms["brightness_range"] = document.getElementById('brightness_range').value;

    g_train_task_parms["contrast_prob"] = document.getElementById('contrast_prob').value;
    g_train_task_parms["contrast_range"] = document.getElementById('contrast_range').value;

    g_train_task_parms["saturation_prob"] = document.getElementById('saturation_prob').value;
    g_train_task_parms["saturation_range"] = document.getElementById('saturation_range').value;

    g_train_task_parms["hue_prob"] = document.getElementById('hue_prob').value;
    g_train_task_parms["hue_range"] = document.getElementById('hue_range').value;

    g_train_task_parms["vertical_flip_prob"] = document.getElementById('vertical_flip_prob').value;
    g_train_task_parms["horizontal_flip_prob"] = document.getElementById('horizontal_flip_prob').value;

    g_train_task_parms["rotate_prob"] = document.getElementById('rotate_prob').value;
    g_train_task_parms["rotate_range"] = document.getElementById('rotate_range').value;

    //保存参数
    if(str_task_id.length > 0)
    {
        var http_request = new XMLHttpRequest();
        if (window.XMLHttpRequest)
        {
            http_request=new XMLHttpRequest();
        }
        else
        {
            http_request=new ActiveXObject("Microsoft.XMLHTTP");
        }
        var data = {"tid":str_task_id,"train":JSON.stringify(g_train_task_parms)};

        http_request.open("POST", str_srv_url + "/project/task/params", false);
        http_request.setRequestHeader("Content-type","application/json");
        http_request.send(JSON.stringify(data));
    }
}

//加载任务数据增强配置参数信息
function load_data_augument_parms()
{
    document.getElementById('brightness_prob').value = g_train_task_parms["brightness_prob"];
    document.getElementById('brightness_range').value = g_train_task_parms["brightness_range"];

    document.getElementById('contrast_prob').value = g_train_task_parms["contrast_prob"];
    document.getElementById('contrast_range').value = g_train_task_parms["contrast_range"];

    document.getElementById('saturation_prob').value = g_train_task_parms["saturation_prob"];
    document.getElementById('saturation_range').value = g_train_task_parms["saturation_range"];

    document.getElementById('hue_prob').value = g_train_task_parms["hue_prob"];
    document.getElementById('hue_range').value = g_train_task_parms["hue_range"];

    document.getElementById('vertical_flip_prob').value = g_train_task_parms["vertical_flip_prob"];
    document.getElementById('horizontal_flip_prob').value = g_train_task_parms["horizontal_flip_prob"];

    document.getElementById('rotate_prob').value = g_train_task_parms["rotate_prob"];
    document.getElementById('rotate_range').value = g_train_task_parms["rotate_range"];
}

//启动训练任务
function start_task(tid)
{
    var train_data = {"tid":tid};
    var train_http_request = new XMLHttpRequest();
    train_http_request.open("POST", str_srv_url + "/project/task/train", false);
    train_http_request.setRequestHeader("Content-type","application/json");
    train_http_request.send(JSON.stringify(train_data));
}

//查看单个项目下的所有任务
function view_project_tasks()
{
    var obj_project_id = document.getElementById('popup_menu_project_id');
    var str_project_id = obj_project_id.value;
    g_view_project_task_id = str_project_id;

    load_project_tasks(str_project_id);
}

//删除项目
function delete_project()
{
    var obj_project_id = document.getElementById('popup_menu_project_id');
    str_del_project_id = obj_project_id.value;

    var result = confirm("删除项目：" + obj_project_id.value + " ？");
    if(!result)
    {
        return;
    }

    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("删除项目：" + str_del_project_id + "删除成功!\n" +  http_request.responseText);
                 load_projects();
            }
            else
            {
                alert("项目" + str_del_project_id + "删除失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }

    var data = {"pid":str_del_project_id};

    http_request.open("DELETE", str_srv_url + "/project", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//删除数据集
function delete_dataset()
{
    var obj_dataset_id = document.getElementById('popup_menu_dataset_id');
    str_del_dataset_id = obj_dataset_id.value;

    var result = confirm("删除数据集：" + str_del_dataset_id + " ？");
    if(!result)
    {
        return;
    }

    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("删除数据集：" + str_del_dataset_id + "删除成功!\n" +  http_request.responseText);
                 load_datasets();
            }
            else
            {
                alert("数据集" + str_del_dataset_id + "删除失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }

    var data = {"did":str_del_dataset_id};

    http_request.open("DELETE", str_srv_url + "/dataset", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//中止任务
function stop_task()
{
    var input_task_detail_id = document.getElementById('task_detail_id');
    var str_stop_task_id = input_task_detail_id.value;

    var result = confirm("确定终止任务：" + str_stop_task_id + " ？");
    if(!result)
    {
        return;
    }

    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("任务：" + str_stop_task_id + "中止成功!\n" +  http_request.responseText);
                 hide_task_detail_info_win_modal();

                 if (document.getElementById('btn_refresh').value == "刷新项目任务信息")
                 {
                     load_project_tasks(g_view_project_task_id);
                 }
                 else
                 {
                     load_tasks();
                 }
            }
            else
            {
                alert("任务：" + str_stop_task_id + "中止失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }

    var data = {"tid":str_stop_task_id,"act":"stop"};

    http_request.open("PUT", str_srv_url + "/project/task/train", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//删除任务
function delete_task()
{
    var obj_task_id = document.getElementById('popup_menu_task_id');
    str_del_task_id = obj_task_id.value;

    var result = confirm("删除任务：" + str_del_task_id + " ？");
    if(!result)
    {
        return;
    }

    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("删除任务：" + str_del_task_id + "删除成功!\n" +  http_request.responseText);
                 if (document.getElementById('btn_refresh').value == "刷新项目任务信息")
                 {
                     load_project_tasks(g_view_project_task_id);
                 }
                 else
                 {
                     load_tasks();
                 }
            }
            else
            {
                alert("任务" + str_del_task_id + "删除失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }

    var data = {"tid":str_del_task_id};

    http_request.open("DELETE", str_srv_url + "/project/task", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//任务模型测试
function test_task_model()
{
    document.getElementById('model_test_img_src').src = "";

    document.getElementById('test_model_name_text').value = "NA";
    document.getElementById('test_model_type_text').value = "NA";
    document.getElementById('test_model_path_text').value = "NA";

    table_test_model_info.rows[0].style.display = "none";
    table_test_model_info.rows[1].style.display = "none";
    table_test_model_info.rows[2].style.display = "none";
    document.getElementById('win_model_predict_test').style.height = "450px";

    var on_win_model_predict_test = document.getElementById('win_model_predict_test');
    var over_win_model_predict_test = document.getElementById('win_model_predict_test_over');

    on_win_model_predict_test.style.display = "block";
    over_win_model_predict_test.style.display = "block";
}

//删除模型
function delete_model()
{
    var obj_model_id = document.getElementById('popup_menu_model_id');
    str_del_model_id = obj_model_id.value;

    var result = confirm("删除模型：" + str_del_model_id + " ？");
    if(!result)
    {
        return;
    }

    var http_request = new XMLHttpRequest();
    http_request.onreadystatechange=function()
    {
        if (http_request.readyState==4)
        {
            if (http_request.status==200)
            {
                 alert("删除模型：" + str_del_model_id + "删除成功!\n" +  http_request.responseText);
                 load_models();
            }
            else
            {
                alert("模型" + str_del_model_id + "删除失败，请检查服务器配置" + http_request.responseText);
            }
        }
    }

    var data = {"emid":str_del_model_id, "type":"exported"};

    http_request.open("DELETE", str_srv_url + "/model", true);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
}

//显示模型预测窗口
function show_model_test_predict_win_modal(obj)
{
    var str_model_id = obj.id;
    var str_model_type = document.getElementById('view_model_detail_type_' + str_model_id).value;
    //保存模型id
    document.getElementById('predict_test_model_id').value = str_model_id;

    //模型信息显示
    table_test_model_info.rows[0].style.display = "table-row";
    table_test_model_info.rows[1].style.display = "table-row";
    table_test_model_info.rows[2].style.display = "table-row";
    document.getElementById('win_model_predict_test').style.height = "540px";

    var str_model_view_type = Project_Type_Name_Enum[str_model_type];
    document.getElementById('model_test_img_src').src = "";

    document.getElementById('test_model_name_text').value = document.getElementById('view_model_detail_name_' + str_model_id).value + "(" + str_model_id + ")";
    document.getElementById('test_model_type_text').value = str_model_view_type + "-" + document.getElementById('view_model_detail_net_' + str_model_id).value;
    document.getElementById('test_model_path_text').value = document.getElementById('view_model_detail_path_' + str_model_id).value;

    var on_win_model_predict_test = document.getElementById('win_model_predict_test');
    var over_win_model_predict_test = document.getElementById('win_model_predict_test_over');

    on_win_model_predict_test.style.display = "block";
    over_win_model_predict_test.style.display = "block";
}

//关闭模型预测窗口
function hide_model_test_predict_win_modal(obj)
{
    document.getElementById('test_model_src_img_path_text').value = "";
    document.getElementById('model_test_img_src').src = "";
    document.getElementById('predict_test_model_id').value = "";
    document.getElementById('model_test_img_result').src = "";

    document.getElementById('btn_model_predict_test').value = "预测";

    var on_win_model_predict_test = document.getElementById('win_model_predict_test');
    var over_win_model_predict_test = document.getElementById('win_model_predict_test_over');

    on_win_model_predict_test.style.display = "none";
    over_win_model_predict_test.style.display = "none";
}

//加载预测原图像并预览
function load_predict_file_and_preview(file)
{
    if (!file.files || !file.files[0])
    {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (evt)
    {
        document.getElementById('model_test_img_result').src = "";
        document.getElementById('model_test_img_src').src = evt.target.result;
        image = evt.target.result;
    }
    reader.readAsDataURL(file.files[0]);
}

//模型预测
function model_predict_test(obj)
{
    if (document.getElementById('btn_model_predict_test').value == "预测中...")
    {
        alert("预测进行中，请稍候...");
        return;
    }
    var str_img_data = document.getElementById('model_test_img_src').src;

    if(document.getElementById('test_model_name_text').value == "NA" && document.getElementById('test_model_type_text').value == "NA")
    {
        var str_predict_task_id = document.getElementById('evaluate_export_task_id').value;
    }
    else
    {
        var str_predict_model_id = document.getElementById('predict_test_model_id').value;
        var str_predict_task_id = document.getElementById("view_model_detail_tid_" + str_predict_model_id).value;
    }

    var str_src_file_name = document.getElementById('test_model_src_img_path_text').value;
    if(str_img_data == "" || str_src_file_name == "")
    {
        alert("请先选择要测试的图片！");
        return;
    }

    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }

    var idx_postfix = str_img_data.indexOf("base64,");
    if(idx_postfix > 0)
    {
        str_img_data = str_img_data.substring(idx_postfix + 7,str_img_data.length);
    }

    var data = {"tid":str_predict_task_id,"image_data":str_img_data};
    http_request.open("POST", str_srv_url + "/project/task/predict", false);
    http_request.setRequestHeader("Content-type","application/json");
    http_request.send(JSON.stringify(data));
    var obj_json = eval('(' + http_request.responseText + ')');
    var str_result_path = obj_json["path"];

    document.getElementById('btn_model_predict_test').value = "预测中...";
    g_predict_wait_times = 0;

    setTimeout(function(){show_predict_result(str_result_path, str_predict_task_id);}, 1000);
}

//显示预测结果等待次数
var g_predict_wait_times = 0;

//显示预测结果
function show_predict_result(str_path, str_task_id)
{
    //获取预测结果
    g_predict_wait_times = g_predict_wait_times + 1;
    var http_request;
    if (window.XMLHttpRequest)
    {
        http_request=new XMLHttpRequest();
    }
    else
    {
        http_request=new ActiveXObject("Microsoft.XMLHTTP");
    }
    http_request.open("GET", str_srv_url + "/project/task/predict?tid=" + str_task_id, false);
    http_request.send(null);

    var obj_json = eval('(' + http_request.responseText + ')');
    var str_predict_status = parseInt(obj_json["predict_status"]);

    if(str_predict_status == PredictStatus.XPREDONE)
    {
        var str_result_content = get_img_file_from_server(str_path);
        var str_b64_type = "data:image/png;base64,";
        document.getElementById('model_test_img_result').src = str_b64_type + str_result_content;

        document.getElementById('btn_model_predict_test').value = "预测";
        alert("预测完成，请查看右图预测结果（双击可放大）。");
    }
    else if(str_predict_status == PredictStatus.XPREFAIL)
    {
        document.getElementById('btn_model_predict_test').value = "预测";
        alert("预测失败，请检测服务器配置:\n" + http_request.responseText);
    }
    else if(str_predict_status == PredictStatus.XPRESTART)
    {
        if(g_predict_wait_times <= 30)
        {
            setTimeout(function(){show_predict_result(str_path, str_task_id);}, 1000);
        }
    }
    else
    {
        if(g_predict_wait_times <= 30)
        {
            setTimeout(function(){show_predict_result(str_path, str_task_id);}, 1000);
        }
    }
}

//新建对象
function create_new(obj)
{
    var str_btn_lbl = obj.value;
    if(str_btn_lbl == "新建数据集")
    {
        show_create_dataset_win_modal(obj);
    }
    else if(str_btn_lbl == "新建项目")
    {
        show_create_project_win_modal(obj);
    }
    else if(str_btn_lbl == "新建任务")
    {
        show_create_task_win_modal(obj);
    }
}

//修改模型下拉列表选项
function change_model_type(obj)
{
    var str_model_name = obj.value;

    if (Backbone_List.hasOwnProperty(str_model_name))
    {
        lst_backbones = Backbone_List[str_model_name];
    }
    else
    {
        lst_backbones = ["NA"];
    }

    var obj_sel_backbone = document.getElementById('task_detail_parm_backbone');
    obj_sel_backbone.options.length = 0;
    obj_sel_backbone.value = "NA";

    if(lst_backbones.length > 0)
    {
        for(var p in lst_backbones)
        {
            obj_sel_backbone.options[obj_sel_backbone.options.length] = new Option(lst_backbones[p], lst_backbones[p]);
        }
    }
    obj_sel_backbone[0].selected = true;
}

//修改创建项目时下拉列表触发更新下拉数据集列表
function change_create_project_type(obj)
{
    str_project_type = obj.value;
    var obj_sel_create_project_dataset_id = document.getElementById('create_project_dataset_id_text');
    obj_sel_create_project_dataset_id.options.length = 0;
    obj_sel_create_project_dataset_id.options[0] = new Option("请选择项目对应数据集", 0);

    for(var p in g_dataset_list)
    {
        str_id = g_dataset_list[p].id;
        str_attr = g_dataset_list[p].attr;
        str_name = str_attr["name"];
        str_desc = str_attr["desc"];
        str_type = str_attr["type"];

        str_status = str_attr["dataset_status"]
        //只有校验通过且切分后的数据集才可以选择
        if(str_status == DatasetStatus.XSPLITED && str_type == str_project_type)
        {
            obj_sel_create_project_dataset_id.options[obj_sel_create_project_dataset_id.options.length] = new Option(str_name, str_id);
        }
    }
}

//更新导航栏链接
function update_nav_bar(str_type = Nav_Bar_Type_Enum["projects"])
{
    var str_html = "控制台 ：";
    if(str_type == Nav_Bar_Type_Enum["projects"])
    {
        str_html = str_html + "<a href=\"javascript:load_projects()\">" + str_type + "</a>";
    }
    else if(str_type == Nav_Bar_Type_Enum["datasets"])
    {
        str_html = str_html + "<a href=\"javascript:load_datasets()\">" + str_type + "</a>";
    }
    else if(str_type == Nav_Bar_Type_Enum["tasks"])
    {
        str_html = str_html + "<a href=\"javascript:load_tasks()\">" + str_type + "</a>";
    }
    else if(str_type == Nav_Bar_Type_Enum["models"])
    {
        str_html = str_html + "<a href=\"javascript:load_models()\">" + str_type + "</a>";
    }
    else if(str_type == Nav_Bar_Type_Enum["project_tasks"])
    {
        str_html = str_html + "<a href=\"javascript:load_projects()\">" + Nav_Bar_Type_Enum["projects"] + "</a>";
        str_html = str_html + "&nbsp&nbsp>&nbsp&nbsp";
        str_html = str_html + "<a href=\"javascript:load_project_tasks(g_view_project_task_id)\">";
        str_html = str_html + g_view_project_task_name + "</a>";
    }

    table_nav_bar.rows[0].cells[1].innerHTML = str_html;
}

//数据集图片预览时前一张及后一张图像
function img_arrow_click(obj)
{
    if(obj.style.borderColor == "gray")
    {
        return;
    }

    if(obj.id == "arrow_pre_img")
    {
        get_one_img_file("pre");
    }
    else
    {
        get_one_img_file("next");
    }
}

//ESC to close browse img window
function dispatch_key_press()
{
    switch(event.keyCode)
    {
        //ESC
        case 27:
        {
            hide_zoom_img(null);
            hide_log_win(null);
        }
    }
}


window.alert = function(msg){
	var maskBg = '#0000002b';						//蒙版展示色
	var zIndex = 999999;							//修改弹出层z-index,应为最顶层,避免被覆盖
	var desColor = '#1f0000'  						//提示信息字体颜色
	var buttonVal = '确定';							//确定按钮名称
	var btnBgColor = '#f61717';						//确定按钮背景颜色
	var btnColor = '#fff';							//确定按钮字体颜色
	var btnAlign = 'right';							//按钮在水平位置,默认居中,变量值:left,center,right
	var style = `
			<style class="mask-style">
				.box-sizing{
					box-sizing: border-box;
				}
				.alertMask{
					position: fixed;	/*生成绝对定位的元素，相对于浏览器窗口进行定位*/
					display: flex;
					display: webkit-flex;
					flex-direction: row;
					align-items: center;
					justify-content: center;
					width: 100%;
					height: 100%;
					top: 0;
					left: 0;
					z-index: `+zIndex+`;
					background: `+maskBg+`;
				}
				.alertContainer{
					min-width: 240px;	/*容器最小240px*/
					max-width: 640px;	/*容器最大320px*/
					background:#fff;
					border: 1px solid `+maskBg+`;
					border-radius: 3px;
					color: `+desColor+`;
					overflow: hidden;									
				}
				.alertDes{
					padding: 35px 30px;
					text-align: center;
					letter-spacing: 1px;
					font-size: 14px;
					color: `+desColor+`;
				}
				.alertDes img{
					max-width: 100%;
					height: auto;
				}
				.alertConfirmParent{
					width: 100%;
					padding: 20px 30px;
					text-align: `+btnAlign+`;
					box-sizing: border-box;
					background: #f2f2f2;
				}
				.alertConfirmBtn{
					cursor: pointer;
					padding: 8px 10px;
					border: none;
					border-radius: 2px;
					color: `+btnColor+`;
					background-color: `+btnBgColor+`;
					box-shadow: 0 0 2px `+btnBgColor+`;
				}
			</style>
		`;
	
	var head = document.getElementsByTagName('head')[0];
	head.innerHTML += style		//头部加入样式,注意不可使用document.write()写入文件,否则出错
	
	const body = document.getElementsByTagName('body')[0];
		
	var alertMask = document.createElement('div');
	var alertContainer = document.createElement('div');
	var alertDes = document.createElement('div');
	var alertConfirmParent = document.createElement('div');
	var alertConfirmBtn = document.createElement('button');	
	
	body.append(alertMask);
	alertMask.classList.add('alertMask');
	alertMask.classList.add('box-sizing');
	
	alertMask.append(alertContainer);
	alertContainer.classList.add('alertContainer');
	alertContainer.classList.add('box-sizing');
		
	alertContainer.append(alertDes);
	alertDes.classList.add('alertDes');
	alertDes.classList.add('box-sizing');
	
	alertContainer.append(alertConfirmParent);
	alertConfirmParent.classList.add('alertConfirmParent');
	alertConfirmParent.classList.add('box-sizing');	
	
	alertConfirmParent.append(alertConfirmBtn);
	alertConfirmBtn.classList.add('alertConfirmBtn');
	alertConfirmBtn.classList.add('box-sizing');
	alertConfirmBtn.innerText = buttonVal;
	
	//加载提示信息	
	alertDes.innerHTML = msg;
	//关闭当前alert弹窗
	function alertBtnClick(){
		body.removeChild(alertMask);
		maskStyle = head.getElementsByClassName('mask-style')[0];
		head.removeChild(maskStyle);	//移除生成的css样式
		
	}
	alertConfirmBtn.addEventListener("click", alertBtnClick);
}
