# JavaScript Path Query Language

Use similar grammar like XPath to query JSON object and array.

### Sample

    {times:[1,2,3,{success:false},{success:true}]}

Use query:

    /times[-1:-2]/success -> [ true, false ]

    /times[-1:-2]/!success/[0] -> false