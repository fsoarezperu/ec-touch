<div class="row p-3">
{{#each remesas}}
  <div class="col-md-2 mx-auto">
    <div class="card text-center">
      <div class="card-body">
        <!-- <h3>REMESAS</h3> -->
        <p># Remesa:{{no_remesa}}</p>
        <p># caja:{{no_caja}}</p>
        <p>codigo_empleado:{{codigo_empleado}}</p>

        <h3 class="card-title text-uppercase">
        S/. {{monto}}
        </h3>
        <a href="" class="btn btn-danger">Borrar</a>
        <!-- <a class="btn btn-primary m-2"  id="unlock">unlock</a>
        <a class="btn btn-primary m-2"  id="lock">lock</a> -->
      </div>
    </div>
  </div>


{{else}}
            <div class="colmd-4 mx-auto">
              <div class="card card-body text-center">
                <p>NO HAY remeas GUARDADOS AUN</p>
                <!-- <a href="/links/add">Create One</a> -->
              </div>
            </div>
{{/each}}

<!--
  <div class="col-md-4 mx-auto">
    <div class="card text-center">
      <div class="card-body">
        <a class="btn btn-primary m-2"  id="reset">reset</a>
        <a class="btn btn-primary m-2"  id="enable">enable validator</a>
        <a class="btn btn-primary m-2"  id="disable">disable validator</a>
        <a class="btn btn-primary m-2"  id="initialize">initialize</a>

      </div>
    </div>
  </div> -->

  <!-- <div class="col-md-4 mx-auto">
    <div class="card text-center">
      <div class="card-body">
        <a href="/" class="btn btn-primary m-2">salir</a>
      </div>
    </div>
  </div> -->

</div>
