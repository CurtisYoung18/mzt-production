运行工作流
 最新更新：3 个月前
启用工作流 API 且创建 API Key 后，您可以通过 API 方式入参以运行工作流，并获取工作流的执行结果。

请求方式
POST

调用地址
https://api-${endpoint}.gptbots.ai/v1/workflow/invoke

调用验证
详情参见 API 概述 的鉴权方式说明。

请求
请求示例
curl -X POST 'https://api-${endpoint}.gptbots.ai/v1/workflow/invoke' \
-H 'Authorization: Bearer ${API Key}' \
-H 'Content-Type: application/json' \
-d '{
    "userId": "<your_user_id>",
    "input": {
        <your_workflow_input_params>
    },
    "isAsync": true,
    "webhook": [
        {
            "method": "POST",
            "url": "https://example-1.com",
            "headers": {
                "Accept": "application/json",
                "Authorization": "Bearer <your_token>"
            }
        },
        {
            "method": "GET",
            "url": "https://example-2.com?fr=google",
            "headers": {
                "Accept": "application/json",
                "Authorization": "Bearer <your_token>"
            }
        }
    ]
}'
请求头
字段	类型	必填	说明
Authorization	Bearer ${API Key}	是	使用 Authorization: Bearer ${API Key} 进行调用验证，请在 API 密钥页面获取密钥作为 API Key。
Content-Type	application/json	是	数据类型，固定值为 application/json。
请求体
字段	类型	必填	说明
userId	String	否	用于标记本次请求的用户 ID。
input	Object	是	即工作流的“开始”节点。该对象内需填入与工作流“开始”节点内配置的完全一致的入参结构。
isAsync	Boolean	否	定义本次请求是否为异步运行。
- true：异步执行。
- false：（默认）同步执行。
注：若为true，则可以使用“查询工作流运行结果”查询结果，或将结果发送给“Webhook”定义的地址。这两种方式互相不冲突。
webhook	Array Object	否	当执行异步操作时，可向指定的 Webhook 发送工作流执行结果。最多可定义 5 个 Webhook 信息。
webhook[].method	String	是	Webhook 的请求方法。
webhook[].url	String	是	Webhook 的请求地址（URL）。
webhook[].headers	Object	否	Webhook 请求的 Headers 信息，可自行定义。
响应
响应示例
若为同步运行，则结果示例如下：

{
    "workflowId": "xxxxxxxx",
    "workflowName": "todayNews",
    "workflowVersion": "1.0.1",
    "workflowRunId": "xxxxxxxx",
    "input": {
        "topic": "News"
    },
    "output": {
        "news": [
            {
                "summary": "Fatal crash shuts down major highway in Haleiwa. According to Emergency Medical Services, paramedics responded to the scene of the crash Wednesday morning.",
                "media": "Hawaii News Now",
                "title": "Hawaii News Now - Breaking News, Latest News, Weather & Traffic"
            },
            {
                "summary": "Hawaii Crime: Man, 65, critically injured in Waikīkī assault. Jamil Hart found guilty in Mililani murder case. HPD busts illegal gambling room in Nanakuli.",
                "media": "KHON2",
                "title": "KHON2: Hawaii News, Weather, Sports, Breaking News & Live"
            }
        ]
    },
    "workflowExecutionTime": 8347,
    "status": "SUCCEED",
    "totalCost": 0.6928,
    "totalTokens": 1745,
    "startTime": 1758765323024,
    "endTime": 1758765331373
}
若为异步运行，则该 API 会立刻返回结果如下：

{
    "workflowId": "xxxxxxxx",
    "workflowName": "todayNews",
    "workflowVersion": "1.0.1",
    "workflowRunId": "xxxxxxxx",
    "status": "PENDING"
}
您可以使用获得的 workflowRunId 异步地查询运行结果。

响应体
字段	类型	说明
workflowId	String	工作流 ID。
workflowName	String	工作流名称。
workflowVersion	String	工作流版本号。
workflowRunId	String	工作流运行 ID，用于唯一标识本次执行。
input	Object	“开始”节点的输入内容，与请求中的 input 相同。
output	Object	“结束”节点的输出内容，包含工作流执行的结果。
workflowExecutionTime	Number	工作流执行耗时，单位为毫秒。
status	String	工作流的调用状态，可能的值包括：
- SUCCEED：成功
- FAILED：失败
- PENDING：队列中
- RUNNING：运行中
totalCost	Number	本次运行的总消耗积分。
totalTokens	Number	本次运行的总消耗 Token。
startTime	Number	开始时间戳，毫秒级。
endTime	Number	结束时间戳，毫秒级。
