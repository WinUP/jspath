# JavaScript Path Query

Query JSON object and array.

### Example

    {times:[1,2,3,{success:false},{success:true}]}

Use query:

    /times/success -> [undefined, undefined, undefined, false, true]

    /times[-1 -> -2]/success -> [ true, false ]

    /times[1 -> last] -> [2, 3, {success:false}, {success:true}] // const last = (array | string).length - 1

    /times[-1 -> -last - 1] -> [{success:true}, {success:false}, 3, 2, 1]